import {
  HealthResponse,
  StatusResponse,
  ModelsResponse,
  InstalledModelsResponse,
  ChatResponse,
  ConfigResponse,
  ApiResult,
} from '../types';

const API_BASE = 'http://127.0.0.1:8081';
const TIMEOUT = 10000; // 10 seconds

async function fetchWithTimeout<T>(
  url: string,
  options: RequestInit = {},
  timeout = TIMEOUT
): Promise<ApiResult<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

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

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { success: false, error: 'Request timeout' };
      }
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Unknown error' };
  }
}

// Health check
export async function checkHealth(): Promise<ApiResult<HealthResponse>> {
  return fetchWithTimeout<HealthResponse>(`${API_BASE}/api/health`, {}, 3000);
}

// Get status
export async function getStatus(): Promise<ApiResult<StatusResponse>> {
  return fetchWithTimeout<StatusResponse>(`${API_BASE}/api/status`);
}

// Get available models
export async function getModels(): Promise<ApiResult<ModelsResponse>> {
  return fetchWithTimeout<ModelsResponse>(`${API_BASE}/api/models`);
}

// Get installed models
export async function getInstalledModels(): Promise<ApiResult<InstalledModelsResponse>> {
  return fetchWithTimeout<InstalledModelsResponse>(`${API_BASE}/api/models/installed`);
}

// Install model
export async function installModel(
  modelName: string
): Promise<ApiResult<{ success: boolean; message: string }>> {
  return fetchWithTimeout<{ success: boolean; message: string }>(
    `${API_BASE}/api/models/install`,
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
  return fetchWithTimeout<{ success: boolean; message: string }>(
    `${API_BASE}/api/models/remove`,
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
  return fetchWithTimeout<{ success: boolean; message: string }>(
    `${API_BASE}/api/models/use`,
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
  message: string
): Promise<ApiResult<ChatResponse>> {
  const result = await fetchWithTimeout<any>(
    `${API_BASE}/api/chat`,
    {
      method: 'POST',
      body: JSON.stringify({ message }),
    },
    120000 // 2 minutes for inference - models can be slow
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Check if we got a valid response
  const responseText = result.data?.response;

  if (responseText && typeof responseText === 'string' && responseText.trim() !== '') {
    return { success: true, data: { response: responseText.trim() } };
  }

  // Empty response - likely no model loaded
  return {
    success: false,
    error: 'No response from model. Please go to Models tab and make sure a model is installed and active (tap a model to activate it).',
  };
}

// Get config
export async function getConfig(): Promise<ApiResult<ConfigResponse>> {
  return fetchWithTimeout<ConfigResponse>(`${API_BASE}/api/config`);
}

// Set config
export async function setConfig(
  key: string,
  value: string
): Promise<ApiResult<{ success: boolean }>> {
  return fetchWithTimeout<{ success: boolean }>(`${API_BASE}/api/config`, {
    method: 'POST',
    body: JSON.stringify({ key, value }),
  });
}
