// API Response Types

export interface HealthResponse {
  healthy: boolean;
}

export interface StatusResponse {
  status: string;
  version: string;
  model: string;
}

export interface Model {
  name: string;
  description: string;
  size: string;
  ram: string;
}

export interface InstalledModel {
  name: string;
  size: string;
  active: boolean;
}

export interface ModelsResponse {
  models: Model[];
}

export interface InstalledModelsResponse {
  models: InstalledModel[];
}

export interface ChatResponse {
  response: string;
}

export interface ConfigResponse {
  active_model?: string;
  threads?: string;
  ctx_size?: string;
  [key: string]: string | undefined;
}

export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Chat Types

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}

// Connection Types

export interface ConnectionStatus {
  connected: boolean;
  version?: string;
  activeModel?: string;
  lastCheck: number;
  error?: string;
}

// Model Download Types

export interface DownloadState {
  modelName: string | null;
  status: 'idle' | 'downloading' | 'complete' | 'error';
  progress: number;
  error?: string;
}

// Setup Types

export type SetupStep = 'welcome' | 'termux' | 'install' | 'start-api' | 'connecting';

export interface SetupState {
  currentStep: SetupStep;
  isComplete: boolean;
}
