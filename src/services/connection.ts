import { checkHealth, getStatus } from './api';
import { ConnectionStatus } from '../types';

export type ConnectionCallback = (status: ConnectionStatus) => void;

class ConnectionManager {
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<ConnectionCallback> = new Set();
  private lastStatus: ConnectionStatus = {
    connected: false,
    lastCheck: 0,
  };

  // Track consecutive failures before marking offline
  private consecutiveFailures = 0;
  private readonly maxFailuresBeforeOffline = 3;

  // Flag to pause polling during active requests
  private isPaused = false;

  // Subscribe to connection status changes
  subscribe(callback: ConnectionCallback): () => void {
    this.listeners.add(callback);
    // Immediately send current status
    callback(this.lastStatus);
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Notify all listeners
  private notify(status: ConnectionStatus) {
    this.lastStatus = status;
    this.listeners.forEach((callback) => callback(status));
  }

  // Pause polling (call before making a long request)
  pause() {
    this.isPaused = true;
  }

  // Resume polling (call after long request completes)
  resume() {
    this.isPaused = false;
    // Reset failure count on resume since we know server responded
    this.consecutiveFailures = 0;
  }

  // Check connection once
  async check(): Promise<ConnectionStatus> {
    // Skip if paused (during active chat request)
    if (this.isPaused) {
      return this.lastStatus;
    }

    const healthResult = await checkHealth();

    if (!healthResult.success || !healthResult.data?.healthy) {
      this.consecutiveFailures++;

      // Only mark as offline after multiple consecutive failures
      if (this.consecutiveFailures >= this.maxFailuresBeforeOffline) {
        const status: ConnectionStatus = {
          connected: false,
          lastCheck: Date.now(),
          error: healthResult.error || 'Backend not responding',
        };
        this.notify(status);
        return status;
      }

      // Not enough failures yet, keep previous status
      return this.lastStatus;
    }

    // Success - reset failure count
    this.consecutiveFailures = 0;

    // Get full status
    const statusResult = await getStatus();

    const status: ConnectionStatus = {
      connected: true,
      version: statusResult.data?.version,
      activeModel: statusResult.data?.model,
      lastCheck: Date.now(),
    };

    this.notify(status);
    return status;
  }

  // Start polling
  startPolling(intervalMs = 5000) {
    if (this.pollingInterval) {
      this.stopPolling();
    }

    // Initial check
    this.check();

    // Start interval
    this.pollingInterval = setInterval(() => {
      this.check();
    }, intervalMs);
  }

  // Stop polling
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  // Get current status without checking
  getLastStatus(): ConnectionStatus {
    return this.lastStatus;
  }
}

// Singleton instance
export const connectionManager = new ConnectionManager();
