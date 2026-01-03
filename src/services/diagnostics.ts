/**
 * Connection Diagnostics Service
 * Helps identify why connection to PocketAI server might be failing
 */

import { Platform } from 'react-native';
import { checkHealth, getStatus, ConnectionErrorCode, discoverApiAddress, getConnectionInfo, clearCachedAddress } from './api';
import { isTermuxInstalled, openTermux } from './termux';
import { connectionManager } from './connection';
import * as Network from 'expo-network';

export interface DiagnosticResult {
  check: string;
  passed: boolean;
  message: string;
  suggestion?: string;
  action?: () => Promise<unknown>;
  actionLabel?: string;
}

export interface DiagnosticsReport {
  timestamp: number;
  platform: string;
  results: DiagnosticResult[];
  overallStatus: 'healthy' | 'issues' | 'critical';
  primaryIssue?: string;
  primarySuggestion?: string;
}

/**
 * Run a quick health check
 */
async function checkServerHealth(): Promise<DiagnosticResult> {
  const result = await checkHealth();

  if (result.success && result.data?.healthy) {
    return {
      check: 'Server Health',
      passed: true,
      message: 'PocketAI server is responding',
    };
  }

  // Analyze error type
  const errorCode = result.errorCode as ConnectionErrorCode;

  if (errorCode === ConnectionErrorCode.TIMEOUT) {
    return {
      check: 'Server Health',
      passed: false,
      message: 'Server is not responding (timeout)',
      suggestion: 'The server might be busy with inference or not running. Check Termux.',
      action: openTermux,
      actionLabel: 'Open Termux',
    };
  }

  if (errorCode === ConnectionErrorCode.CONNECTION_REFUSED) {
    return {
      check: 'Server Health',
      passed: false,
      message: 'Cannot connect to server',
      suggestion: 'Server is not running. Start it with "pai api web" in Termux.',
      action: openTermux,
      actionLabel: 'Open Termux',
    };
  }

  return {
    check: 'Server Health',
    passed: false,
    message: result.error || 'Server health check failed',
    suggestion: 'Try restarting the PocketAI server in Termux.',
  };
}

/**
 * Check if Termux is installed
 */
async function checkTermuxInstallation(): Promise<DiagnosticResult> {
  const installed = await isTermuxInstalled();

  if (installed) {
    return {
      check: 'Termux Installation',
      passed: true,
      message: 'Termux is installed',
    };
  }

  return {
    check: 'Termux Installation',
    passed: false,
    message: 'Termux not detected',
    suggestion: 'Install Termux from F-Droid (not Play Store)',
  };
}

/**
 * Check if a model is loaded
 */
async function checkModelStatus(): Promise<DiagnosticResult> {
  const result = await getStatus();

  if (!result.success) {
    return {
      check: 'Model Status',
      passed: false,
      message: 'Could not check model status',
      suggestion: 'Server needs to be running first',
    };
  }

  if (result.data?.model) {
    return {
      check: 'Model Status',
      passed: true,
      message: `Active model: ${result.data.model}`,
    };
  }

  return {
    check: 'Model Status',
    passed: false,
    message: 'No model is currently loaded',
    suggestion: 'Go to Models tab and tap a model to activate it',
  };
}

/**
 * Check platform compatibility
 */
function checkPlatform(): DiagnosticResult {
  if (Platform.OS !== 'android') {
    return {
      check: 'Platform',
      passed: false,
      message: `Running on ${Platform.OS}`,
      suggestion: 'PocketAI requires Android with Termux',
    };
  }

  const version = Platform.Version;
  if (typeof version === 'number' && version < 24) {
    return {
      check: 'Platform',
      passed: false,
      message: `Android API ${version} is too old`,
      suggestion: 'Android 7.0 (API 24) or higher is required',
    };
  }

  return {
    check: 'Platform',
    passed: true,
    message: `Android API ${version}`,
  };
}

/**
 * Run all diagnostics
 */
export async function runDiagnostics(): Promise<DiagnosticsReport> {
  const results: DiagnosticResult[] = [];

  // Platform check (sync)
  results.push(checkPlatform());

  // Async checks
  const [termuxResult, healthResult] = await Promise.all([
    checkTermuxInstallation(),
    checkServerHealth(),
  ]);

  results.push(termuxResult);
  results.push(healthResult);

  // Only check model if server is healthy
  if (healthResult.passed) {
    const modelResult = await checkModelStatus();
    results.push(modelResult);
  }

  // Determine overall status
  const failedChecks = results.filter(r => !r.passed);
  let overallStatus: 'healthy' | 'issues' | 'critical';

  if (failedChecks.length === 0) {
    overallStatus = 'healthy';
  } else if (failedChecks.some(r =>
    r.check === 'Platform' ||
    r.check === 'Termux Installation' ||
    r.check === 'Server Health'
  )) {
    overallStatus = 'critical';
  } else {
    overallStatus = 'issues';
  }

  // Find primary issue
  const primaryIssue = failedChecks[0];

  return {
    timestamp: Date.now(),
    platform: `${Platform.OS} ${Platform.Version}`,
    results,
    overallStatus,
    primaryIssue: primaryIssue?.message,
    primarySuggestion: primaryIssue?.suggestion,
  };
}

/**
 * Quick connection test - just checks if server responds
 */
export async function quickConnectionTest(): Promise<{
  connected: boolean;
  error?: string;
  suggestion?: string;
}> {
  const result = await checkHealth();

  if (result.success && result.data?.healthy) {
    return { connected: true };
  }

  // Provide specific suggestion based on error
  let suggestion = 'Check if Termux is running with "pai api web"';

  if (result.errorCode === ConnectionErrorCode.TIMEOUT) {
    suggestion = 'Server is slow or not responding. Check if Termux is still running and not killed by battery optimization.';
  } else if (result.errorCode === ConnectionErrorCode.CONNECTION_REFUSED) {
    suggestion = 'Server is not running. Open Termux and run "source ~/.pocketai_env && pai api web"';
  }

  return {
    connected: false,
    error: result.error,
    suggestion,
  };
}

/**
 * Get troubleshooting tips based on error
 */
export function getTroubleshootingTips(errorCode?: string): string[] {
  const tips: string[] = [];

  switch (errorCode) {
    case ConnectionErrorCode.TIMEOUT:
      tips.push('Check if Termux is still running (not killed by system)');
      tips.push('Disable battery optimization for Termux');
      tips.push('Make sure no VPN is blocking localhost');
      tips.push('Try restarting the PocketAI server');
      break;

    case ConnectionErrorCode.CONNECTION_REFUSED:
      tips.push('Open Termux and run: pai api web');
      tips.push('Make sure Termux has "Allow external apps" enabled');
      tips.push('Check for error messages in Termux');
      tips.push('Try reinstalling PocketAI in Termux');
      break;

    case ConnectionErrorCode.SERVER_ERROR:
      tips.push('Check Termux for error messages');
      tips.push('Make sure a model is installed and activated');
      tips.push('Try restarting the server with: pai api web');
      tips.push('Check if you have enough RAM for the model');
      break;

    default:
      tips.push('Make sure Termux is open and server is running');
      tips.push('Disable battery optimization for Termux');
      tips.push('Try restarting both apps');
      tips.push('Check Termux for any error messages');
  }

  return tips;
}

/**
 * Test which addresses can connect to the server
 */
export interface AddressTestResult {
  address: string;
  success: boolean;
  responseTimeMs?: number;
  error?: string;
}

export async function testAllAddresses(): Promise<{
  results: AddressTestResult[];
  workingAddress?: string;
  deviceIp?: string;
}> {
  const addresses = [
    'http://localhost:8081',
    'http://127.0.0.1:8081',
    'http://0.0.0.0:8081',
  ];

  // Get device IP
  let deviceIp: string | undefined;
  try {
    deviceIp = await Network.getIpAddressAsync();
    if (deviceIp && deviceIp !== '0.0.0.0') {
      addresses.push(`http://${deviceIp}:8081`);
    }
  } catch (e) {
    console.log('[Diagnostics] Could not get device IP');
  }

  const results: AddressTestResult[] = [];
  let workingAddress: string | undefined;

  for (const address of addresses) {
    const start = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      const response = await fetch(`${address}/api/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data?.healthy) {
          const responseTimeMs = Date.now() - start;
          results.push({ address, success: true, responseTimeMs });
          if (!workingAddress) {
            workingAddress = address;
          }
          continue;
        }
      }
      results.push({ address, success: false, error: `HTTP ${response.status}` });
    } catch (e: any) {
      clearTimeout(timeoutId);
      results.push({
        address,
        success: false,
        error: e.name === 'AbortError' ? 'Timeout' : e.message,
      });
    }
  }

  return { results, workingAddress, deviceIp };
}

/**
 * Get detailed network diagnostics
 */
export interface NetworkDiagnostics {
  networkState: {
    isConnected: boolean;
    isInternetReachable: boolean | null;
    type: string;
  };
  deviceIp: string | null;
  addressTests: AddressTestResult[];
  workingAddress: string | null;
  currentCachedAddress: string;
  recommendation: string;
}

export async function getNetworkDiagnostics(): Promise<NetworkDiagnostics> {
  // Get network state
  const networkState = await Network.getNetworkStateAsync();

  // Test all addresses
  const { results, workingAddress, deviceIp } = await testAllAddresses();

  // Get current connection info
  const connInfo = getConnectionInfo();

  // Generate recommendation
  let recommendation: string;
  if (workingAddress) {
    if (workingAddress !== connInfo.currentAddress) {
      recommendation = `Found working address: ${workingAddress}. Your device may have issues with "${connInfo.currentAddress}".`;
    } else {
      recommendation = 'Connection is working properly.';
    }
  } else {
    recommendation = 'No working address found. Make sure Termux is running with "pai api web".';
  }

  return {
    networkState: {
      isConnected: networkState.isConnected ?? false,
      isInternetReachable: networkState.isInternetReachable ?? null,
      type: networkState.type ?? 'unknown',
    },
    deviceIp: deviceIp || null,
    addressTests: results,
    workingAddress: workingAddress || null,
    currentCachedAddress: connInfo.currentAddress,
    recommendation,
  };
}

/**
 * Reset address cache and try discovery again
 */
export async function resetAndRediscover(): Promise<{
  success: boolean;
  newAddress?: string;
  error?: string;
}> {
  try {
    // Clear cached address
    await clearCachedAddress();

    // Try to discover a working address
    const address = await discoverApiAddress();

    if (address) {
      return { success: true, newAddress: address };
    } else {
      return { success: false, error: 'No working address found' };
    }
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Get browser test URLs for manual debugging
 */
export function getBrowserTestUrls(): string[] {
  return [
    'http://localhost:8081/api/health',
    'http://127.0.0.1:8081/api/health',
  ];
}
