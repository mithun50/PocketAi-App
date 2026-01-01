import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useConnectionCheck } from '../../src/hooks/useBackendStatus';
import { markSetupComplete } from '../../src/services/storage';
import { SetupStep } from '../../src/components/SetupStep';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';

export default function ConnectingScreen() {
  const router = useRouter();

  const handleConnected = useCallback(async () => {
    await markSetupComplete();
    router.replace('/(main)/chat');
  }, [router]);

  const { checking, error, attempts } = useConnectionCheck(handleConnected, 2000);

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
      <View style={styles.content}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.statusText}>
            Attempting to connect... ({attempts} attempts)
          </Text>
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
        </View>

        {attempts > 5 && (
          <View style={styles.troubleshootBox}>
            <Text style={styles.troubleshootTitle}>Troubleshooting</Text>
            <Text style={styles.troubleshootText}>
              - Make sure Termux is still running
              {'\n'}- Check if "pai api start" completed successfully
              {'\n'}- Look for "Server running on port 8081" message
              {'\n'}- Try running the command again in Termux
            </Text>
          </View>
        )}

        {attempts > 10 && (
          <View style={styles.helpBox}>
            <Text style={styles.helpTitle}>Still not working?</Text>
            <Text style={styles.helpText}>
              Try these steps in Termux:
              {'\n\n'}1. Stop any running server: Ctrl+C
              {'\n'}2. Navigate to folder: cd ~/PocketAi
              {'\n'}3. Activate environment: source ~/.pocketai_env
              {'\n'}4. Start API: pai api start
            </Text>
          </View>
        )}
      </View>
    </SetupStep>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
  loaderContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  troubleshootBox: {
    backgroundColor: colors.surfaceLight,
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
});
