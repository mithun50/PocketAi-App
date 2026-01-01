import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message } from '../types';

const KEYS = {
  CHAT_HISTORY: '@pocketai/chat_history',
  SETUP_COMPLETE: '@pocketai/setup_complete',
  SETTINGS: '@pocketai/settings',
};

const MAX_MESSAGES = 100;

// Chat History
export async function saveChatHistory(messages: Message[]): Promise<void> {
  try {
    // Keep only last MAX_MESSAGES
    const trimmed = messages.slice(-MAX_MESSAGES);
    await AsyncStorage.setItem(KEYS.CHAT_HISTORY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Failed to save chat history:', error);
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

export async function clearChatHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEYS.CHAT_HISTORY);
  } catch (error) {
    console.error('Failed to clear chat history:', error);
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

export async function markSetupComplete(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.SETUP_COMPLETE, 'true');
  } catch (error) {
    console.error('Failed to mark setup complete:', error);
  }
}

export async function resetSetup(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEYS.SETUP_COMPLETE);
  } catch (error) {
    console.error('Failed to reset setup:', error);
  }
}

// Settings
export interface AppSettings {
  showWelcomeModel?: boolean;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
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
export async function clearAllData(): Promise<void> {
  try {
    const keys = Object.values(KEYS);
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    console.error('Failed to clear all data:', error);
  }
}
