import { useState, useEffect, useCallback, useRef } from 'react';
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

  // Force refresh that bypasses cache (use after model activation)
  const forceRefresh = useCallback(async () => {
    return connectionManager.forceStatusRefresh();
  }, []);

  return {
    ...status,
    refresh,
    forceRefresh,
  };
}

// Hook for one-time connection check (used in connecting screen)
// Uses address discovery to try all fallback addresses
export function useConnectionCheck(onConnected: () => void, intervalMs = 2000) {
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [errorCode, setErrorCode] = useState<string | undefined>();
  const [attempts, setAttempts] = useState(0);
  const [discoveredAddress, setDiscoveredAddress] = useState<string | undefined>();

  // Use ref to track attempts without causing re-renders
  const attemptRef = useRef(0);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    let mounted = true;

    const check = async () => {
      if (!mounted) return;

      attemptRef.current += 1;
      const attemptNum = attemptRef.current;
      setAttempts(attemptNum);

      // Use discovery on first attempt and every 5 attempts
      // This tries all fallback addresses (localhost, 127.0.0.1, device IP, etc.)
      const useDiscovery = attemptNum === 1 || attemptNum % 5 === 0;

      let result;
      if (useDiscovery) {
        console.log(`[useConnectionCheck] Attempt ${attemptNum}: Using address discovery...`);
        result = await connectionManager.checkWithDiscovery();
      } else {
        result = await connectionManager.check();
      }

      if (!mounted) return;

      if (result.connected) {
        setChecking(false);
        setError(undefined);
        setErrorCode(undefined);
        setDiscoveredAddress(result.apiAddress);
        console.log(`[useConnectionCheck] Connected via: ${result.apiAddress}`);
        onConnected();
      } else {
        setError(result.error);
        setErrorCode(result.errorCode);
      }
    };

    // Initial check with discovery
    check();

    // Start interval
    intervalId = setInterval(check, intervalMs);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [onConnected, intervalMs]);

  // Manual retry with full discovery
  const retryWithDiscovery = useCallback(async () => {
    attemptRef.current += 1;
    setAttempts(attemptRef.current);
    const result = await connectionManager.forceCheckWithDiscovery();
    if (result.connected) {
      setChecking(false);
      setError(undefined);
      setErrorCode(undefined);
      setDiscoveredAddress(result.apiAddress);
      onConnected();
    } else {
      setError(result.error);
      setErrorCode(result.errorCode);
    }
  }, [onConnected]);

  return { checking, error, errorCode, attempts, discoveredAddress, retryWithDiscovery };
}
