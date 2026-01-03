import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useConnectionCheck } from '../../src/hooks/useBackendStatus';
import { markSetupComplete } from '../../src/services/storage';
import { SetupStep } from '../../src/components/SetupStep';
import { BatteryWarning } from '../../src/components/BatteryWarning';
import { openTermux } from '../../src/services/termux';
import { getTroubleshootingTips, getBrowserTestUrls } from '../../src/services/diagnostics';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';

export default function ConnectingScreen() {
  const router = useRouter();
  const [showBatteryWarning, setShowBatteryWarning] = useState(false);
  const [troubleshootingTips, setTroubleshootingTips] = useState<string[]>([]);

  const handleConnected = useCallback(async () => {
    await markSetupComplete();
    router.replace('/(main)/chat');
  }, [router]);

  const { checking, error, attempts, errorCode, discoveredAddress, retryWithDiscovery } = useConnectionCheck(handleConnected, 2000);

  // Show battery warning after 3 failed attempts
  useEffect(() => {
    if (attempts >= 3 && !showBatteryWarning) {
      setShowBatteryWarning(true);
    }
  }, [attempts]);

  // Update troubleshooting tips based on error
  useEffect(() => {
    if (attempts > 5) {
      const tips = getTroubleshootingTips(errorCode);
      setTroubleshootingTips(tips);
    }
  }, [attempts, errorCode]);

  const handleOpenTermux = async () => {
    await openTermux();
  };

  const getStatusMessage = () => {
    if (attempts === 0) return 'Initializing...';
    if (attempts <= 3) return `Connecting to server... (attempt ${attempts})`;
    if (attempts <= 10) return `Still trying to connect... (${attempts} attempts)`;
    return `Connection taking longer than expected (${attempts} attempts)`;
  };

  const getStatusColor = () => {
    if (attempts <= 3) return colors.primary;
    if (attempts <= 10) return colors.warning;
    return colors.error;
  };

  return (
    <SetupStep
      title="Connecting..."
      subtitle="Looking for the PocketAI server on your device."
      step={5}
      totalSteps={5}
      secondaryAction={{
        label: 'Back to Instructions',
        onPress: () => router.back(),
      }}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Connection Status */}
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={getStatusColor()} />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusMessage()}
            </Text>
            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}
          </View>

          {/* Battery Warning - show after 3 attempts */}
          {showBatteryWarning && (
            <BatteryWarning
              visible={true}
              onDismiss={() => setShowBatteryWarning(false)}
            />
          )}

          {/* Quick Actions */}
          {attempts > 3 && (
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleOpenTermux}>
                <Text style={styles.actionButtonText}>Open Termux</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.actionButtonSecondary]} onPress={retryWithDiscovery}>
                <Text style={styles.actionButtonText}>Retry All Addresses</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Troubleshooting after 5 attempts */}
          {attempts > 5 && troubleshootingTips.length > 0 && (
            <View style={styles.troubleshootBox}>
              <Text style={styles.troubleshootTitle}>🔧 Troubleshooting Tips</Text>
              {troubleshootingTips.map((tip, index) => (
                <Text key={index} style={styles.troubleshootText}>
                  • {tip}
                </Text>
              ))}
            </View>
          )}

          {/* Detailed help after 10 attempts */}
          {attempts > 10 && (
            <View style={styles.helpBox}>
              <Text style={styles.helpTitle}>⚠️ Connection Failed</Text>
              <Text style={styles.helpText}>
                The server isn't responding. Try these steps in Termux:
              </Text>
              <View style={styles.commandBox}>
                <Text style={styles.commandText}>
                  # Stop any running server{'\n'}
                  Ctrl+C{'\n\n'}
                  # Restart the server{'\n'}
                  source ~/.pocketai_env{'\n'}
                  pai api web
                </Text>
              </View>
              <Text style={styles.helpText}>
                {'\n'}Look for: "Server running on port 8081"
              </Text>
              <Text style={styles.helpTextSmall}>
                {'\n'}If you see errors about missing packages, run:{'\n'}
                <Text style={styles.commandInline}>cd ~/PocketAi && ./setup.sh</Text>
              </Text>
            </View>
          )}

          {/* Browser test after 10 attempts */}
          {attempts > 10 && (
            <View style={styles.browserTestBox}>
              <Text style={styles.browserTestTitle}>🌐 Test in Browser</Text>
              <Text style={styles.browserTestDesc}>
                Tap to test the connection in your browser. If it works there but not here, your device may have app-specific restrictions.
              </Text>
              <View style={styles.browserTestButtons}>
                {getBrowserTestUrls().map((url, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.browserTestButton}
                    onPress={() => Linking.openURL(url)}
                  >
                    <Text style={styles.browserTestButtonText}>
                      {url.replace('http://', '').replace('/api/health', '')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Common issues after 15 attempts */}
          {attempts > 15 && (
            <View style={styles.issuesBox}>
              <Text style={styles.issuesTitle}>📋 Common Issues</Text>

              <View style={styles.issueItem}>
                <Text style={styles.issueName}>Battery Optimization</Text>
                <Text style={styles.issueDesc}>
                  Android kills Termux in background. Disable battery optimization for Termux.
                </Text>
              </View>

              <View style={styles.issueItem}>
                <Text style={styles.issueName}>Server Not Started</Text>
                <Text style={styles.issueDesc}>
                  Make sure you ran "pai api web" and see "Server running" message.
                </Text>
              </View>

              <View style={styles.issueItem}>
                <Text style={styles.issueName}>Termux Permissions</Text>
                <Text style={styles.issueDesc}>
                  Some ROMs restrict background apps. Check app permissions for Termux.
                </Text>
              </View>

              <View style={styles.issueItem}>
                <Text style={styles.issueName}>VPN/Firewall</Text>
                <Text style={styles.issueDesc}>
                  Some VPNs block localhost. Try disabling VPN temporarily.
                </Text>
              </View>

              <View style={styles.issueItem}>
                <Text style={styles.issueName}>Address Resolution</Text>
                <Text style={styles.issueDesc}>
                  Some devices don't resolve "localhost". The app tries multiple addresses (127.0.0.1, device IP) automatically.
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SetupStep>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  loaderContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  statusText: {
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  actionButtonSecondary: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionButtonText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  troubleshootBox: {
    backgroundColor: colors.surfaceElevated,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  troubleshootTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  troubleshootText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 22,
    marginLeft: spacing.xs,
  },
  helpBox: {
    backgroundColor: '#3d2914',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  helpTitle: {
    color: colors.warning,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  helpText: {
    color: '#f5d9b0',
    fontSize: fontSize.sm,
    lineHeight: 22,
  },
  helpTextSmall: {
    color: '#d4b896',
    fontSize: fontSize.xs,
    lineHeight: 20,
  },
  commandBox: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
  },
  commandText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  commandInline: {
    color: colors.primary,
    fontFamily: 'monospace',
  },
  issuesBox: {
    backgroundColor: colors.surfaceElevated,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  issuesTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  issueItem: {
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  issueName: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginBottom: 4,
  },
  issueDesc: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    lineHeight: 18,
  },
  browserTestBox: {
    backgroundColor: colors.surfaceElevated,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  browserTestTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  browserTestDesc: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  browserTestButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  browserTestButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
  },
  browserTestButtonText: {
    color: colors.text,
    fontSize: fontSize.xs,
    fontFamily: 'monospace',
  },
});
