import { checkHealth, checkHealthWithDiscovery, getStatus, ConnectionErrorCode, discoverApiAddress, getApiBase, getConnectionInfo } from './api';
import { ConnectionStatus } from '../types';

export type ConnectionCallback = (status: ConnectionStatus) => void;

interface RetryConfig {
  baseInterval: number;
  maxInterval: number;
  backoffMultiplier: number;
}

class ConnectionManager {
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<ConnectionCallback> = new Set();
  private lastStatus: ConnectionStatus = {
    connected: false,
    lastCheck: 0,
  };
  private lastErrorCode: string | undefined;

  // Track consecutive failures before marking offline
  private consecutiveFailures = 0;
  private readonly maxFailuresBeforeOffline = 3;

  // Flag to pause polling during active requests
  private isPaused = false;

  // Retry configuration with exponential backoff
  private retryConfig: RetryConfig = {
    baseInterval: 5000,    // Start with 5 seconds when disconnected
    maxInterval: 30000,    // Max 30 seconds between retries
    backoffMultiplier: 1.5, // Increase by 50% on each failure
  };
  private currentInterval: number = 5000;

  // Connected state uses longer polling interval
  private readonly connectedPollingInterval = 15000; // 15 seconds when connected

  // Track last full status check to avoid calling it every time
  private lastFullStatusCheck = 0;
  private readonly statusCheckInterval = 30000; // Full status check every 30 seconds

  // Track connection recovery attempts
  private recoveryAttempts = 0;
  private readonly maxRecoveryAttempts = 10;

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

  // Resume polling after successful request
  resume() {
    this.isPaused = false;
    // Reset failure count on resume since we know server responded
    this.consecutiveFailures = 0;
    // Use connected interval since we just got a successful response
    this.currentInterval = this.connectedPollingInterval;
    if (this.pollingInterval) {
      this.restartPollingWithBackoff();
    }
  }

  // Resume polling after failed request (don't reset backoff)
  resumeWithError() {
    this.isPaused = false;
    // Don't reset failure count or backoff - server may still be struggling
    // Add a small delay before next poll to give server time to recover
    this.increaseBackoff();
  }

  // Reset backoff to base interval
  private resetBackoff() {
    this.currentInterval = this.retryConfig.baseInterval;
    this.recoveryAttempts = 0;
  }

  // Increase backoff interval
  private increaseBackoff() {
    this.currentInterval = Math.min(
      this.currentInterval * this.retryConfig.backoffMultiplier,
      this.retryConfig.maxInterval
    );
    this.recoveryAttempts++;
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
      this.lastErrorCode = healthResult.errorCode;

      // Apply exponential backoff
      this.increaseBackoff();

      // Only mark as offline after multiple consecutive failures
      if (this.consecutiveFailures >= this.maxFailuresBeforeOffline) {
        const status: ConnectionStatus = {
          connected: false,
          lastCheck: Date.now(),
          error: healthResult.error || 'Backend not responding',
          errorCode: healthResult.errorCode,
        };
        this.notify(status);

        // Restart polling with new backoff interval if we're in recovery mode
        if (this.pollingInterval && this.recoveryAttempts < this.maxRecoveryAttempts) {
          this.restartPollingWithBackoff();
        }

        return status;
      }

      // Not enough failures yet, keep previous status but update error info
      return {
        ...this.lastStatus,
        error: healthResult.error,
        errorCode: healthResult.errorCode,
      };
    }

    // Success - reset failure count, error code, and backoff
    this.consecutiveFailures = 0;
    this.lastErrorCode = undefined;
    this.resetBackoff();

    const now = Date.now();

    // Switch to longer polling interval when connected
    if (this.pollingInterval && this.currentInterval !== this.connectedPollingInterval) {
      this.currentInterval = this.connectedPollingInterval;
      this.restartPollingWithBackoff();
    }

    // Only get full status periodically to reduce load
    const shouldGetStatus = now - this.lastFullStatusCheck > this.statusCheckInterval;

    let version = this.lastStatus.version;
    let activeModel = this.lastStatus.activeModel;

    if (shouldGetStatus) {
      const statusResult = await getStatus();
      version = statusResult.data?.version;
      activeModel = statusResult.data?.model;
      this.lastFullStatusCheck = now;
    }

    const status: ConnectionStatus = {
      connected: true,
      version,
      activeModel,
      lastCheck: now,
      errorCode: undefined,
      apiAddress: getApiBase(),
    };

    this.notify(status);
    return status;
  }

  // Check connection with address discovery (tries all fallback addresses)
  async checkWithDiscovery(): Promise<ConnectionStatus> {
    // Skip if paused
    if (this.isPaused) {
      return this.lastStatus;
    }

    console.log('[ConnectionManager] Running connection check with address discovery...');
    const healthResult = await checkHealthWithDiscovery();

    if (!healthResult.success || !healthResult.data?.healthy) {
      this.consecutiveFailures++;
      this.lastErrorCode = healthResult.errorCode;
      this.increaseBackoff();

      const status: ConnectionStatus = {
        connected: false,
        lastCheck: Date.now(),
        error: healthResult.error || 'Backend not responding on any address',
        errorCode: healthResult.errorCode,
      };
      this.notify(status);
      return status;
    }

    // Success - we found a working address
    console.log(`[ConnectionManager] Connected via: ${healthResult.discoveredAddress}`);
    this.consecutiveFailures = 0;
    this.lastErrorCode = undefined;
    this.resetBackoff();

    // Get full status
    const statusResult = await getStatus();

    const status: ConnectionStatus = {
      connected: true,
      version: statusResult.data?.version,
      activeModel: statusResult.data?.model,
      lastCheck: Date.now(),
      errorCode: undefined,
      apiAddress: healthResult.discoveredAddress,
    };

    this.notify(status);
    return status;
  }

  // Restart polling with current backoff interval
  private restartPollingWithBackoff() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = setInterval(() => {
        this.check();
      }, this.currentInterval);
    }
  }

  // Start polling
  startPolling(intervalMs = 5000) {
    if (this.pollingInterval) {
      this.stopPolling();
    }

    this.retryConfig.baseInterval = intervalMs;
    this.currentInterval = intervalMs;

    // Initial check
    this.check();

    // Start interval
    this.pollingInterval = setInterval(() => {
      this.check();
    }, this.currentInterval);
  }

  // Stop polling
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.resetBackoff();
  }

  // Get current status without checking
  getLastStatus(): ConnectionStatus {
    return this.lastStatus;
  }

  // Get current retry info (useful for UI)
  getRetryInfo(): { attempts: number; nextRetryMs: number; isRecovering: boolean } {
    return {
      attempts: this.recoveryAttempts,
      nextRetryMs: this.currentInterval,
      isRecovering: this.consecutiveFailures >= this.maxFailuresBeforeOffline,
    };
  }

  // Force immediate check (useful for manual retry button)
  async forceCheck(): Promise<ConnectionStatus> {
    // Reset backoff on manual retry
    this.resetBackoff();
    this.consecutiveFailures = 0;

    const status = await this.check();

    // Restart polling with reset interval
    if (this.pollingInterval) {
      this.restartPollingWithBackoff();
    }

    return status;
  }

  // Force refresh status including activeModel (bypasses cache)
  async forceStatusRefresh(): Promise<ConnectionStatus> {
    const healthResult = await checkHealth();

    if (!healthResult.success || !healthResult.data?.healthy) {
      return this.lastStatus;
    }

    // Always fetch full status
    const statusResult = await getStatus();
    const now = Date.now();
    this.lastFullStatusCheck = now;

    const status: ConnectionStatus = {
      connected: true,
      version: statusResult.data?.version,
      activeModel: statusResult.data?.model,
      lastCheck: now,
      errorCode: undefined,
      apiAddress: getApiBase(),
    };

    this.notify(status);
    return status;
  }

  // Force check with address discovery (tries all fallback addresses)
  // Use this when initial connection fails or for troubleshooting
  async forceCheckWithDiscovery(): Promise<ConnectionStatus> {
    // Reset backoff on manual retry
    this.resetBackoff();
    this.consecutiveFailures = 0;

    const status = await this.checkWithDiscovery();

    // Restart polling with reset interval
    if (this.pollingInterval) {
      this.restartPollingWithBackoff();
    }

    return status;
  }

  // Get connection diagnostic info
  getConnectionDiagnostics(): {
    currentAddress: string;
    isCached: boolean;
    consecutiveFailures: number;
    isRecovering: boolean;
    backoffInterval: number;
  } {
    const connInfo = getConnectionInfo();
    return {
      ...connInfo,
      consecutiveFailures: this.consecutiveFailures,
      isRecovering: this.consecutiveFailures >= this.maxFailuresBeforeOffline,
      backoffInterval: this.currentInterval,
    };
  }
}

// Singleton instance
export const connectionManager = new ConnectionManager();
