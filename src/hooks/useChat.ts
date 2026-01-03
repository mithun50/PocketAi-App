import { useState, useEffect, useCallback, useRef } from 'react';
import { sendMessageWithFallback, StreamResult } from '../services/api';
import { saveChatHistory, loadChatHistory, clearChatHistory } from '../services/storage';
import { connectionManager } from '../services/connection';
import { Message } from '../types';
import { Alert } from 'react-native';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export interface StreamingInfo {
  isStreaming: boolean;
  streamingMessageId: string | null;
  usedFallback: boolean;
  tokenCount: number;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Streaming state
  const [streamingInfo, setStreamingInfo] = useState<StreamingInfo>({
    isStreaming: false,
    streamingMessageId: null,
    usedFallback: false,
    tokenCount: 0,
  });

  // Ref to abort current stream
  const abortRef = useRef<(() => void) | null>(null);

  // Load chat history on mount
  useEffect(() => {
    loadChatHistory().then(setMessages);
  }, []);

  // Track if we've shown storage error to avoid spamming
  const storageErrorShown = useRef(false);

  // Save chat history when messages change (but not during active streaming)
  useEffect(() => {
    if (messages.length > 0 && !streamingInfo.isStreaming) {
      saveChatHistory(messages).then((result) => {
        if (!result.success && !storageErrorShown.current) {
          storageErrorShown.current = true;
          Alert.alert(
            'Storage Warning',
            'Unable to save chat history. Your messages may not persist after closing the app.',
            [{ text: 'OK', onPress: () => { storageErrorShown.current = false; } }]
          );
        }
      });
    }
  }, [messages, streamingInfo.isStreaming]);

  // Abort current stream
  const abort = useCallback(() => {
    if (abortRef.current) {
      abortRef.current();
      abortRef.current = null;
    }
  }, []);

  const send = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    setError(undefined);
    setIsLoading(true);

    // Add user message
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    };

    // Create placeholder AI message for streaming
    const aiMessageId = generateId();
    const aiMessage: Message = {
      id: aiMessageId,
      role: 'assistant',
      content: '', // Will be updated during streaming
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage, aiMessage]);

    // Set streaming state
    setStreamingInfo({
      isStreaming: true,
      streamingMessageId: aiMessageId,
      usedFallback: false,
      tokenCount: 0,
    });

    // Pause health check polling during inference (server is busy)
    connectionManager.pause();

    let tokenCount = 0;

    const { abort: abortFn, promise } = sendMessageWithFallback(
      content.trim(),
      {
        onToken: (token, fullText) => {
          tokenCount++;
          // Update the AI message content with streaming text
          // Throttle updates - update every 3 tokens or first token for responsiveness
          if (tokenCount === 1 || tokenCount % 3 === 0) {
            requestAnimationFrame(() => {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMessageId
                    ? { ...msg, content: fullText }
                    : msg
                )
              );
            });
          }
          // Update token count even less frequently to reduce re-renders
          if (tokenCount % 10 === 0 || tokenCount === 1) {
            setStreamingInfo((prev) => ({
              ...prev,
              tokenCount,
            }));
          }
        },
        onComplete: (fullResponse) => {
          // Final update with complete response
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, content: fullResponse, timestamp: Date.now() }
                : msg
            )
          );
        },
        onError: (errorMsg, willFallback) => {
          if (!willFallback) {
            setError(errorMsg);
          }
        },
        onFallbackStart: () => {
          setStreamingInfo((prev) => ({
            ...prev,
            usedFallback: true,
          }));
        },
      }
    );

    // Store abort function
    abortRef.current = abortFn;

    // Wait for result
    const result: StreamResult = await promise;

    // Clear abort ref
    abortRef.current = null;

    // Handle result
    if (result.success) {
      connectionManager.resume(); // Reset backoff on success
    } else if (result.aborted) {
      // User aborted - remove the empty AI message
      setMessages((prev) => prev.filter((msg) => msg.id !== aiMessageId));
      connectionManager.resume();
    } else {
      // Error - remove the empty AI message if it has no content
      setMessages((prev) => {
        const aiMsg = prev.find((msg) => msg.id === aiMessageId);
        if (aiMsg && !aiMsg.content.trim()) {
          return prev.filter((msg) => msg.id !== aiMessageId);
        }
        return prev;
      });
      connectionManager.resumeWithError();
    }

    // Reset states
    setIsLoading(false);
    setStreamingInfo({
      isStreaming: false,
      streamingMessageId: null,
      usedFallback: result.usedFallback,
      tokenCount,
    });
  }, [isLoading]);

  const clear = useCallback(async () => {
    // Abort any ongoing stream
    abort();

    setMessages([]);
    setError(undefined);
    setStreamingInfo({
      isStreaming: false,
      streamingMessageId: null,
      usedFallback: false,
      tokenCount: 0,
    });

    const result = await clearChatHistory();
    if (!result.success) {
      Alert.alert(
        'Storage Error',
        'Failed to clear chat history from storage. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [abort]);

  return {
    messages,
    isLoading,
    error,
    send,
    clear,
    abort,
    streamingInfo,
  };
}
