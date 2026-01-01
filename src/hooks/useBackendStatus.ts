import { useState, useEffect, useCallback } from 'react';
import { connectionManager } from '../services/connection';
import { ConnectionStatus } from '../types';

export function useBackendStatus(pollInterval = 5000) {
  const [status, setStatus] = useState<ConnectionStatus>({
    connected: false,
    lastCheck: 0,
  });

  useEffect(() => {
    // Subscribe to connection changes
    const unsubscribe = connectionManager.subscribe(setStatus);

    // Start polling
    connectionManager.startPolling(pollInterval);

    return () => {
      unsubscribe();
      connectionManager.stopPolling();
    };
  }, [pollInterval]);

  const refresh = useCallback(async () => {
    return connectionManager.check();
  }, []);

  return {
    ...status,
    refresh,
  };
}

// Hook for one-time connection check (used in connecting screen)
export function useConnectionCheck(onConnected: () => void, intervalMs = 2000) {
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    let mounted = true;

    const check = async () => {
      if (!mounted) return;

      setAttempts((prev) => prev + 1);
      const result = await connectionManager.check();

      if (!mounted) return;

      if (result.connected) {
        setChecking(false);
        onConnected();
      } else {
        setError(result.error);
      }
    };

    // Initial check
    check();

    // Start interval
    intervalId = setInterval(check, intervalMs);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [onConnected, intervalMs]);

  return { checking, error, attempts };
}
