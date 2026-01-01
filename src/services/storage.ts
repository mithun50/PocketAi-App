import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message } from '../types';

const KEYS = {
  CHAT_HISTORY: '@pocketai/chat_history',
  SETUP_COMPLETE: '@pocketai/setup_complete',
  SETTINGS: '@pocketai/settings',
};

const MAX_MESSAGES = 100;

// Storage result type for error handling
export interface StorageResult {
  success: boolean;
  error?: string;
}

// Chat History
export async function saveChatHistory(messages: Message[]): Promise<StorageResult> {
  try {
    // Keep only last MAX_MESSAGES
    const trimmed = messages.slice(-MAX_MESSAGES);
    await AsyncStorage.setItem(KEYS.CHAT_HISTORY, JSON.stringify(trimmed));
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown storage error';
    console.error('Failed to save chat history:', error);
    return { success: false, error: errorMsg };
  }
}

export async function loadChatHistory(): Promise<Message[]> {
  try {
    const saved = await AsyncStorage.getItem(KEYS.CHAT_HISTORY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load chat history:', error);
  }
  return [];
}

export async function clearChatHistory(): Promise<StorageResult> {
  try {
    await AsyncStorage.removeItem(KEYS.CHAT_HISTORY);
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown storage error';
    console.error('Failed to clear chat history:', error);
    return { success: false, error: errorMsg };
  }
}

// Setup Complete Flag
export async function isSetupComplete(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(KEYS.SETUP_COMPLETE);
    return value === 'true';
  } catch (error) {
    console.error('Failed to check setup status:', error);
    return false;
  }
}

export async function markSetupComplete(): Promise<StorageResult> {
  try {
    await AsyncStorage.setItem(KEYS.SETUP_COMPLETE, 'true');
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown storage error';
    console.error('Failed to mark setup complete:', error);
    return { success: false, error: errorMsg };
  }
}

export async function resetSetup(): Promise<StorageResult> {
  try {
    await AsyncStorage.removeItem(KEYS.SETUP_COMPLETE);
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown storage error';
    console.error('Failed to reset setup:', error);
    return { success: false, error: errorMsg };
  }
}

// Settings
export interface AppSettings {
  showWelcomeModel?: boolean;
}

export async function saveSettings(settings: AppSettings): Promise<StorageResult> {
  try {
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown storage error';
    console.error('Failed to save settings:', error);
    return { success: false, error: errorMsg };
  }
}

export async function loadSettings(): Promise<AppSettings> {
  try {
    const saved = await AsyncStorage.getItem(KEYS.SETTINGS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return {};
}

// Clear all data
export async function clearAllData(): Promise<StorageResult> {
  try {
    const keys = Object.values(KEYS);
    await AsyncStorage.multiRemove(keys);
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown storage error';
    console.error('Failed to clear all data:', error);
    return { success: false, error: errorMsg };
  }
}
