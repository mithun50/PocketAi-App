import { useState, useEffect, useCallback } from 'react';
import { sendMessage } from '../services/api';
import { saveChatHistory, loadChatHistory, clearChatHistory } from '../services/storage';
import { connectionManager } from '../services/connection';
import { Message } from '../types';

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

  // Save chat history when messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory(messages);
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
        // Show error as AI message
        const errorText = result.error || 'Failed to get response';
        setError(errorText);
        const errorMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: errorText,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (err: any) {
      const errorText = err?.message || 'Unknown error occurred';
      setError(errorText);
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: `Error: ${errorText}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      // Resume health check polling
      connectionManager.resume();
    }

    setIsLoading(false);
  }, [isLoading]);

  const clear = useCallback(async () => {
    setMessages([]);
    setError(undefined);
    await clearChatHistory();
  }, []);

  return {
    messages,
    isLoading,
    error,
    send,
    clear,
  };
}
