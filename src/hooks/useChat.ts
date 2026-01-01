import { useState, useEffect, useCallback, useRef } from 'react';
import { sendMessage } from '../services/api';
import { saveChatHistory, loadChatHistory, clearChatHistory } from '../services/storage';
import { connectionManager } from '../services/connection';
import { Message } from '../types';
import { Alert } from 'react-native';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Load chat history on mount
  useEffect(() => {
    loadChatHistory().then(setMessages);
  }, []);

  // Track if we've shown storage error to avoid spamming
  const storageErrorShown = useRef(false);

  // Save chat history when messages change
  useEffect(() => {
    if (messages.length > 0) {
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
  }, [messages]);

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

    setMessages((prev) => [...prev, userMessage]);

    // Pause health check polling during inference (server is busy)
    connectionManager.pause();

    try {
      // Send to API
      const result = await sendMessage(content.trim());

      if (result.success && result.data?.response) {
        const aiMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: result.data.response,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        // Show error in error state only - don't duplicate as message
        // This prevents error showing twice (in UI banner AND in message list)
        setError(result.error || 'Failed to get response');
      }
    } catch (err: any) {
      // Show error in error state only - don't duplicate as message
      setError(err?.message || 'Unknown error occurred');
    } finally {
      // Resume health check polling
      connectionManager.resume();
    }

    setIsLoading(false);
  }, [isLoading]);

  const clear = useCallback(async () => {
    setMessages([]);
    setError(undefined);
    const result = await clearChatHistory();
    if (!result.success) {
      Alert.alert(
        'Storage Error',
        'Failed to clear chat history from storage. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, []);

  return {
    messages,
    isLoading,
    error,
    send,
    clear,
  };
}
