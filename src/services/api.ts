import {
  HealthResponse,
  StatusResponse,
  ModelsResponse,
  InstalledModelsResponse,
  ChatResponse,
  ConfigResponse,
  ApiResult,
  StreamCallbacks,
} from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';

// Fallback addresses for devices where 'localhost' doesn't resolve
// Order: most common first, then fallbacks
const API_ADDRESSES = [
  'http://localhost:8081',
  'http://127.0.0.1:8081',
  'http://0.0.0.0:8081',
  // Device IP will be added dynamically
];

const API_PORT = 8081;
const STORAGE_KEY = '@pocketai/working_api_address';
const TIMEOUT = 15000; // 15 seconds - allow more time for slow devices

// Cached working address
let cachedApiBase: string | null = null;
let addressDiscoveryInProgress = false;

/**
 * Get device's local IP address
 */
async function getDeviceIpAddress(): Promise<string | null> {
  try {
    const ip = await Network.getIpAddressAsync();
    if (ip && ip !== '0.0.0.0') {
      return ip;
    }
  } catch (e) {
    console.log('[API] Could not get device IP:', e);
  }
  return null;
}

/**
 * Get all addresses to try (including device IP)
 */
async function getAllAddresses(): Promise<string[]> {
  const addresses = [...API_ADDRESSES];

  // Add device's own IP
  const deviceIp = await getDeviceIpAddress();
  if (deviceIp) {
    const deviceUrl = `http://${deviceIp}:${API_PORT}`;
    if (!addresses.includes(deviceUrl)) {
      addresses.push(deviceUrl);
    }
  }

  return addresses;
}

/**
 * Quick health check with short timeout for address discovery
 */
async function quickHealthCheck(baseUrl: string, timeoutMs = 3000): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/api/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return data?.healthy === true;
    }
    return false;
  } catch {
    clearTimeout(timeoutId);
    return false;
  }
}

/**
 * Discover working API address by trying all fallbacks
 * Caches the result for future use
 */
export async function discoverApiAddress(): Promise<string | null> {
  // Return cached if available
  if (cachedApiBase) {
    // Verify it still works
    const stillWorks = await quickHealthCheck(cachedApiBase);
    if (stillWorks) {
      return cachedApiBase;
    }
    // Clear cache if no longer working
    cachedApiBase = null;
  }

  // Prevent concurrent discovery
  if (addressDiscoveryInProgress) {
    // Wait a bit and check cache
    await new Promise(resolve => setTimeout(resolve, 500));
    return cachedApiBase;
  }

  addressDiscoveryInProgress = true;

  try {
    // Try to load previously working address from storage
    const storedAddress = await AsyncStorage.getItem(STORAGE_KEY);
    if (storedAddress) {
      console.log(`[API] Trying stored address: ${storedAddress}`);
      const works = await quickHealthCheck(storedAddress);
      if (works) {
        cachedApiBase = storedAddress;
        console.log(`[API] Stored address works: ${storedAddress}`);
        return storedAddress;
      }
    }

    // Try all addresses
    const addresses = await getAllAddresses();
    console.log(`[API] Discovering API address from ${addresses.length} candidates...`);

    for (const addr of addresses) {
      console.log(`[API] Trying: ${addr}`);
      const works = await quickHealthCheck(addr);
      if (works) {
        console.log(`[API] Found working address: ${addr}`);
        cachedApiBase = addr;
        // Save for next time
        await AsyncStorage.setItem(STORAGE_KEY, addr);
        return addr;
      }
    }

    console.log('[API] No working address found');
    return null;
  } finally {
    addressDiscoveryInProgress = false;
  }
}

/**
 * Get the current API base URL
 * Returns cached address or first default
 */
export function getApiBase(): string {
  return cachedApiBase || API_ADDRESSES[0];
}

/**
 * Clear cached address (useful for troubleshooting)
 */
export async function clearCachedAddress(): Promise<void> {
  cachedApiBase = null;
  await AsyncStorage.removeItem(STORAGE_KEY);
}

/**
 * Get info about current connection for diagnostics
 */
export function getConnectionInfo(): {
  currentAddress: string;
  isCached: boolean;
  allAddresses: string[];
} {
  return {
    currentAddress: getApiBase(),
    isCached: cachedApiBase !== null,
    allAddresses: API_ADDRESSES,
  };
}

// Error codes for better troubleshooting
export enum ConnectionErrorCode {
  TIMEOUT = 'TIMEOUT',
  CONNECTION_REFUSED = 'CONNECTION_REFUSED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  UNKNOWN = 'UNKNOWN',
}

export interface DetailedError {
  code: ConnectionErrorCode;
  message: string;
  suggestion: string;
  technical?: string;
}

// Parse error and provide helpful message
function parseError(error: Error, timeout: number): DetailedError {
  const errorMessage = error.message.toLowerCase();

  // Timeout
  if (error.name === 'AbortError') {
    return {
      code: ConnectionErrorCode.TIMEOUT,
      message: `Server didn't respond within ${timeout / 1000}s`,
      suggestion: 'The server might be busy or not running. Check if Termux is still open.',
      technical: error.message,
    };
  }

  // Connection refused - server not running
  if (errorMessage.includes('network request failed') ||
      errorMessage.includes('failed to fetch') ||
      errorMessage.includes('connection refused')) {
    return {
      code: ConnectionErrorCode.CONNECTION_REFUSED,
      message: 'Cannot connect to PocketAI server',
      suggestion: 'Make sure Termux is running with "pai api web" command. Check battery optimization settings.',
      technical: error.message,
    };
  }

  // Network error
  if (errorMessage.includes('network') || errorMessage.includes('internet')) {
    return {
      code: ConnectionErrorCode.NETWORK_ERROR,
      message: 'Network error occurred',
      suggestion: 'This is a localhost connection - no internet needed. Try restarting Termux.',
      technical: error.message,
    };
  }

  // Generic error
  return {
    code: ConnectionErrorCode.UNKNOWN,
    message: error.message || 'Unknown error',
    suggestion: 'Try restarting both the app and Termux.',
    technical: error.message,
  };
}

// Format error for user display
function formatErrorMessage(detailedError: DetailedError): string {
  return `${detailedError.message}. ${detailedError.suggestion}`;
}

async function fetchWithTimeout<T>(
  url: string,
  options: RequestInit = {},
  timeout = TIMEOUT
): Promise<ApiResult<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  console.log(`[API] Fetching: ${url}`);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);
    console.log(`[API] Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorDetail: DetailedError = {
        code: ConnectionErrorCode.SERVER_ERROR,
        message: `Server error: ${response.status}`,
        suggestion: response.status === 500
          ? 'The server encountered an error. Check Termux for error messages.'
          : 'Unexpected server response. Try restarting the server.',
        technical: `HTTP ${response.status}: ${response.statusText}`,
      };
      return {
        success: false,
        error: formatErrorMessage(errorDetail),
        errorCode: errorDetail.code,
      } as ApiResult<T>;
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error) {
      const detailedError = parseError(error, timeout);
      console.log(`[API] Error: ${detailedError.code} - ${detailedError.technical}`);
      return {
        success: false,
        error: formatErrorMessage(detailedError),
        errorCode: detailedError.code,
      } as ApiResult<T>;
    }
    return { success: false, error: 'Unknown error occurred. Try restarting the app.' };
  }
}

// Health check - longer timeout for slow/busy devices
export async function checkHealth(): Promise<ApiResult<HealthResponse>> {
  const base = getApiBase();
  return fetchWithTimeout<HealthResponse>(`${base}/api/health`, {}, 8000);
}

// Health check with address discovery - tries all addresses to find working one
export async function checkHealthWithDiscovery(): Promise<ApiResult<HealthResponse> & { discoveredAddress?: string }> {
  const address = await discoverApiAddress();
  if (address) {
    const result = await fetchWithTimeout<HealthResponse>(`${address}/api/health`, {}, 8000);
    return { ...result, discoveredAddress: address };
  }
  return {
    success: false,
    error: 'Could not connect to server on any address. Make sure Termux is running with "pai api web".',
    errorCode: ConnectionErrorCode.CONNECTION_REFUSED,
  };
}

// Get status
export async function getStatus(): Promise<ApiResult<StatusResponse>> {
  const base = getApiBase();
  return fetchWithTimeout<StatusResponse>(`${base}/api/status`);
}

// Get available models
export async function getModels(): Promise<ApiResult<ModelsResponse>> {
  const base = getApiBase();
  return fetchWithTimeout<ModelsResponse>(`${base}/api/models`);
}

// Get installed models
export async function getInstalledModels(): Promise<ApiResult<InstalledModelsResponse>> {
  const base = getApiBase();
  return fetchWithTimeout<InstalledModelsResponse>(`${base}/api/models/installed`);
}

// Install model
export async function installModel(
  modelName: string
): Promise<ApiResult<{ success: boolean; message: string }>> {
  const base = getApiBase();
  return fetchWithTimeout<{ success: boolean; message: string }>(
    `${base}/api/models/install`,
    {
      method: 'POST',
      body: JSON.stringify({ model: modelName }),
    },
    300000 // 5 minutes timeout for downloads
  );
}

// Remove model
export async function removeModel(
  modelName: string
): Promise<ApiResult<{ success: boolean; message: string }>> {
  const base = getApiBase();
  return fetchWithTimeout<{ success: boolean; message: string }>(
    `${base}/api/models/remove`,
    {
      method: 'POST',
      body: JSON.stringify({ model: modelName }),
    }
  );
}

// Activate model
export async function activateModel(
  modelName: string
): Promise<ApiResult<{ success: boolean; message: string }>> {
  const base = getApiBase();
  return fetchWithTimeout<{ success: boolean; message: string }>(
    `${base}/api/models/use`,
    {
      method: 'POST',
      body: JSON.stringify({ model: modelName }),
    }
  );
}

// Send chat message
// PocketAI API expects: POST /api/chat with {"message": "text"}
// Returns: {"response": "output"}
export async function sendMessage(
  message: string,
  timeoutMs = 600000 // 10 minutes default - LLM inference can be very slow on phones
): Promise<ApiResult<ChatResponse>> {
  const base = getApiBase();

  // Skip pre-flight check - it blocks when server is busy with inference
  // The chat endpoint will return an error if no model is active anyway

  const result = await fetchWithTimeout<any>(
    `${base}/api/chat`,
    {
      method: 'POST',
      body: JSON.stringify({ message }),
    },
    timeoutMs
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Check if we got a response
  const responseText = result.data?.response;

  // Accept any string response, including empty (model might be processing)
  if (typeof responseText === 'string') {
    const trimmed = responseText.trim();
    if (trimmed) {
      return { success: true, data: { response: trimmed } };
    }
    // Empty response - could be model issue or processing
    return {
      success: false,
      error: 'Model returned empty response. Try asking again or check if the model is working properly.',
    };
  }

  // No response field at all - API issue
  return {
    success: false,
    error: 'Invalid response from API. Make sure PocketAI backend is running correctly.',
  };
}

// Get config
export async function getConfig(): Promise<ApiResult<ConfigResponse>> {
  const base = getApiBase();
  return fetchWithTimeout<ConfigResponse>(`${base}/api/config`);
}

// Reset server - kills stuck processes
export async function resetServer(): Promise<ApiResult<{ reset: boolean; message: string }>> {
  const base = getApiBase();
  console.log('[API] Resetting server (killing stuck processes)...');
  return fetchWithTimeout<{ reset: boolean; message: string }>(`${base}/api/reset`, {}, 10000);
}

// Set config
export async function setConfig(
  key: string,
  value: string
): Promise<ApiResult<{ success: boolean }>> {
  const base = getApiBase();
  return fetchWithTimeout<{ success: boolean }>(`${base}/api/config`, {
    method: 'POST',
    body: JSON.stringify({ key, value }),
  });
}

// ============================================
// STREAMING CHAT API
// ============================================

const STREAM_TIMEOUT = 60000; // 60 seconds before first token (inference can be slow)
const STREAM_IDLE_TIMEOUT = 120000; // 120 seconds between tokens

export interface StreamResult {
  success: boolean;
  fullResponse?: string;
  error?: string;
  usedFallback: boolean;
  aborted?: boolean;
}

/**
 * Send message with streaming response (SSE)
 * Uses XHR with progressive reading for real-time token streaming
 * Returns a controller to abort the stream if needed
 */
export function sendMessageStream(
  message: string,
  callbacks: StreamCallbacks
): { abort: () => void; promise: Promise<StreamResult> } {
  const base = getApiBase();
  let aborted = false;
  let xhr: XMLHttpRequest | null = null;

  const abort = () => {
    aborted = true;
    if (xhr) {
      xhr.abort();
    }
  };

  const promise = new Promise<StreamResult>((resolve) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let fullText = '';
    let receivedFirstToken = false;
    let resolved = false;
    let lastProcessedIndex = 0;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
    };

    const safeResolve = (result: StreamResult) => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve(result);
      }
    };

    const processSSEData = (responseText: string) => {
      // Process only new data
      const newData = responseText.substring(lastProcessedIndex);
      lastProcessedIndex = responseText.length;

      if (!newData) return;

      // Split into SSE events
      const events = newData.split('\n');

      for (const line of events) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;

        const jsonStr = trimmed.substring(5).trim();
        if (!jsonStr) continue;

        try {
          const data = JSON.parse(jsonStr);

          if (data.token !== undefined) {
            console.log(`[API] Token: "${data.token}"`);
            if (!receivedFirstToken) {
              receivedFirstToken = true;
              if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
              }
            }
            fullText += data.token;
            callbacks.onToken(data.token, fullText);
          } else if (data.done === true) {
            const finalResponse = data.full_response || fullText;
            console.log(`[API] Stream complete, length: ${finalResponse.length}`);
            callbacks.onComplete(finalResponse);
            safeResolve({ success: true, fullResponse: finalResponse, usedFallback: false });
          }
        } catch (e) {
          // Ignore parse errors for incomplete JSON
        }
      }
    };

    console.log(`[API] Starting XHR stream: ${base}/api/chat/stream`);

    xhr = new XMLHttpRequest();
    xhr.open('POST', `${base}/api/chat/stream`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'text/event-stream');

    // Timeout for initial response
    timeoutId = setTimeout(() => {
      if (!receivedFirstToken && xhr) {
        console.log('[API] Stream timeout');
        xhr.abort();
        callbacks.onError('Connection timeout', true);
        safeResolve({ success: false, error: 'Timeout', usedFallback: false });
      }
    }, STREAM_TIMEOUT);

    // Process data as it arrives
    xhr.onprogress = () => {
      if (xhr && xhr.responseText) {
        processSSEData(xhr.responseText);
      }
    };

    xhr.onreadystatechange = () => {
      if (!xhr) return;

      // readyState 3 = receiving data
      if (xhr.readyState === 3 && xhr.responseText) {
        processSSEData(xhr.responseText);
      }

      // readyState 4 = complete
      if (xhr.readyState === 4) {
        cleanup();

        if (aborted) {
          safeResolve({ success: false, error: 'Aborted', usedFallback: false, aborted: true });
          return;
        }

        // Process any remaining data
        if (xhr.responseText) {
          processSSEData(xhr.responseText);
        }

        // If we got text but didn't resolve yet
        if (!resolved && fullText) {
          callbacks.onComplete(fullText);
          safeResolve({ success: true, fullResponse: fullText, usedFallback: false });
        } else if (!resolved) {
          callbacks.onError('No response received', true);
          safeResolve({ success: false, error: 'No response', usedFallback: false });
        }
      }
    };

    xhr.onerror = () => {
      cleanup();
      if (!resolved) {
        callbacks.onError('Connection error', true);
        safeResolve({ success: false, error: 'Connection error', usedFallback: false });
      }
    };

    xhr.send(JSON.stringify({ message }));
  });

  return { abort, promise };
}

/**
 * Send message with streaming, automatically fallback to regular endpoint on failure
 */
export function sendMessageWithFallback(
  message: string,
  callbacks: StreamCallbacks & {
    onFallbackStart?: () => void;
  },
  timeoutMs = 600000 // 10 minutes for fallback
): { abort: () => void; promise: Promise<StreamResult> } {
  let aborted = false;
  let currentAbort: (() => void) | null = null;

  const abort = () => {
    aborted = true;
    if (currentAbort) currentAbort();
  };

  const promise = (async (): Promise<StreamResult> => {
    // Try streaming first
    console.log('[API] Attempting streaming chat...');
    const stream = sendMessageStream(message, {
      onToken: callbacks.onToken,
      onComplete: callbacks.onComplete,
      onError: (error, willFallback) => {
        // Don't call onError yet if we'll fallback
        if (!willFallback) {
          callbacks.onError(error, false);
        }
      },
    });

    currentAbort = stream.abort;
    const streamResult = await stream.promise;

    if (aborted) {
      return { success: false, error: 'Aborted', usedFallback: false, aborted: true };
    }

    if (streamResult.success) {
      return streamResult;
    }

    // Streaming failed, try fallback
    console.log('[API] Streaming failed, resetting server and falling back...');
    callbacks.onFallbackStart?.();

    // Reset server to kill any stuck processes
    try {
      await resetServer();
      // Wait a moment for cleanup
      await new Promise(r => setTimeout(r, 1000));
    } catch (e) {
      console.log('[API] Server reset failed, continuing anyway...');
    }

    try {
      const result = await sendMessage(message, timeoutMs);

      if (result.success && result.data?.response) {
        console.log('[API] Fallback successful');
        callbacks.onComplete(result.data.response);
        return {
          success: true,
          fullResponse: result.data.response,
          usedFallback: true
        };
      }

      const errorMsg = result.error || 'Fallback also failed';
      callbacks.onError(errorMsg, false);
      return { success: false, error: errorMsg, usedFallback: true };

    } catch (error: any) {
      const errorMsg = error.message || 'Fallback failed';
      callbacks.onError(errorMsg, false);
      return { success: false, error: errorMsg, usedFallback: true };
    }
  })();

  return { abort, promise };
}

/**
 * Check if streaming endpoint is available
 */
export async function checkStreamingAvailable(): Promise<boolean> {
  const base = getApiBase();
  try {
    // Just check if the endpoint responds (OPTIONS or small request)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${base}/api/chat/stream`, {
      method: 'OPTIONS',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    // 200, 204, or 405 (method not allowed but endpoint exists) all indicate availability
    return response.status < 500;
  } catch {
    return false;
  }
}
