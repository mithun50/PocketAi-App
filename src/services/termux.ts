import * as Linking from 'expo-linking';
import * as Clipboard from 'expo-clipboard';
import * as IntentLauncher from 'expo-intent-launcher';
import { Platform, Alert, NativeModules } from 'react-native';

const TERMUX_PACKAGE = 'com.termux';

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
 * Copy command to clipboard, then open Termux
 * Shows instruction to paste
 */
export async function runInTermux(command: string): Promise<TermuxResult> {
  if (Platform.OS !== 'android') {
    return { success: false, error: 'Only available on Android' };
  }

  try {
    // Copy command to clipboard
    await Clipboard.setStringAsync(command);

    // Open Termux
    const openResult = await openTermux();

    if (openResult.success) {
      // Show toast/alert after small delay
      setTimeout(() => {
        Alert.alert(
          'Command Ready!',
          'The command is copied to clipboard.\n\nIn Termux:\n1. Long-press the screen\n2. Tap "Paste"\n3. Press Enter to run',
          [{ text: 'Got it' }]
        );
      }, 300);
      return { success: true };
    } else {
      return { success: false, error: 'Could not open Termux. Is it installed?' };
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed' };
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
