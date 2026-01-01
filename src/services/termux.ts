import * as Linking from 'expo-linking';
import * as Clipboard from 'expo-clipboard';
import * as IntentLauncher from 'expo-intent-launcher';
import { Platform, Alert, NativeModules } from 'react-native';
import Constants from 'expo-constants';

const TERMUX_PACKAGE = 'com.termux';
const TERMUX_BIN_PATH = '/data/data/com.termux/files/usr/bin';
const TERMUX_HOME = '/data/data/com.termux/files/home';

// Native module for Termux service intents (only available in built APK, not Expo Go)
const TermuxIntent = NativeModules.TermuxIntent;

// Check if running in Expo Go (native modules won't work there)
const isExpoGo = Constants.appOwnership === 'expo';

export interface TermuxResult {
  success: boolean;
  error?: string;
  needsPermission?: boolean;
}

/**
 * Check if Termux is installed without opening it
 * Uses multiple URL scheme checks - doesn't actually launch Termux
 */
export async function isTermuxInstalled(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    // Check various Termux URL schemes that indicate installation
    // These are content providers that Termux registers
    const urlsToCheck = [
      'content://com.termux.documents/',
      'content://com.termux.filepicker/',
    ];

    for (const url of urlsToCheck) {
      try {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) return true;
      } catch {
        // Continue checking other URLs
      }
    }

    // Alternative: Check if Termux RUN_COMMAND intent is available
    // This uses VIEW action which won't launch the app
    try {
      const canOpenTermux = await Linking.canOpenURL('termux://');
      if (canOpenTermux) return true;
    } catch {
      // termux:// scheme may not be registered
    }

    return false;
  } catch (error: any) {
    return false;
  }
}

/**
 * Open Termux app
 */
export async function openTermux(): Promise<TermuxResult> {
  if (Platform.OS !== 'android') {
    return { success: false, error: 'Only available on Android' };
  }

  try {
    await IntentLauncher.startActivityAsync('android.intent.action.MAIN', {
      packageName: TERMUX_PACKAGE,
      className: 'com.termux.app.TermuxActivity',
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Termux not installed' };
  }
}

/**
 * Execute command in Termux using RUN_COMMAND service intent
 * Falls back to clipboard method if native module unavailable
 */
export async function runInTermux(command: string): Promise<TermuxResult> {
  if (Platform.OS !== 'android') {
    return { success: false, error: 'Only available on Android' };
  }

  // Try native module first (only works in built APK, not Expo Go)
  // Requires Termux "Allow External Apps" setting enabled
  if (!isExpoGo && TermuxIntent) {
    try {
      await TermuxIntent.runCommand(
        `${TERMUX_BIN_PATH}/bash`,
        ['-c', command],
        TERMUX_HOME,
        false // not background - show in terminal
      );
      // Open Termux to see output
      await openTermux();
      return { success: true };
    } catch (nativeError: any) {
      console.log('Native Termux intent failed:', nativeError.message);
      // Fall through to clipboard fallback
    }
  }

  // Fallback: Copy to clipboard and open Termux
  try {
    await Clipboard.setStringAsync(command);
    const openResult = await openTermux();

    if (openResult.success) {
      setTimeout(() => {
        Alert.alert(
          'Paste Command in Termux',
          'Command copied! Long-press → Paste → Enter\n\nFor auto-execute, run in Termux:\necho "allow-external-apps=true" >> ~/.termux/termux.properties\n\nThen restart Termux.',
          [{ text: 'OK' }]
        );
      }, 300);
      return { success: true, needsPermission: true };
    }
    return { success: false, error: 'Could not open Termux' };
  } catch (fallbackError: any) {
    return { success: false, error: fallbackError.message || 'Failed' };
  }
}

/**
 * Open F-Droid to install Termux
 */
export async function openFDroidForTermux(): Promise<void> {
  const fdroidUrl = 'https://f-droid.org/en/packages/com.termux/';

  try {
    await Linking.openURL(fdroidUrl);
  } catch {
    Alert.alert('Cannot Open', 'Please visit f-droid.org and search for Termux');
  }
}

/**
 * Execute setup commands
 */
export async function runSetupInTermux(): Promise<TermuxResult> {
  const setupScript = `pkg update -y && pkg install -y git curl && git clone https://github.com/mithun50/PocketAi.git ~/PocketAi && cd ~/PocketAi && chmod +x setup.sh && ./setup.sh`;
  return runInTermux(setupScript);
}

/**
 * Start PocketAI API server with web dashboard
 */
export async function startApiInTermux(): Promise<TermuxResult> {
  const command = 'source ~/.pocketai_env 2>/dev/null; cd ~/PocketAi && pai api web';
  return runInTermux(command);
}

/**
 * Install a model via Termux CLI
 */
export async function installModelViaTermux(modelName: string): Promise<TermuxResult> {
  const command = `source ~/.pocketai_env && pai install ${modelName}`;
  return runInTermux(command);
}
