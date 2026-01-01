import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SetupStep } from '../../src/components/SetupStep';
import { CommandBlock } from '../../src/components/CommandBlock';
import { startApiInTermux } from '../../src/services/termux';
import { SETUP_COMMANDS } from '../../src/constants/commands';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';

export default function StartApiScreen() {
  const router = useRouter();
  const [commandSent, setCommandSent] = useState(false);

  const handleStartApi = async () => {
    const result = await startApiInTermux();

    if (result.success) {
      setCommandSent(true);
    } else {
      Alert.alert(
        'Termux Not Found',
        'Could not open Termux. Is it installed?',
        [{ text: 'OK' }]
      );
    }
  };

  const handleContinue = () => {
    router.push('/(setup)/connecting');
  };

  // Show waiting UI after command is sent
  if (commandSent) {
    return (
      <SetupStep
        title="Starting API..."
        subtitle="The API start command was sent to Termux."
        step={4}
        totalSteps={5}
        primaryAction={{
          label: 'Check Connection',
          onPress: handleContinue,
        }}
        secondaryAction={{
          label: 'Send Command Again',
          onPress: handleStartApi,
        }}
      >
        <View style={styles.content}>
          <View style={styles.waitingBox}>
            <Text style={styles.waitingTitle}>Almost there!</Text>
            <Text style={styles.waitingText}>
              1. Switch to Termux app{'\n'}
              2. Long-press and tap "Paste"{'\n'}
              3. Press Enter to start the API{'\n'}
              4. Wait for "Server running on port 8081"{'\n'}
              5. Tap "Check Connection" below
            </Text>
          </View>

          <View style={styles.successIndicator}>
            <Text style={styles.successTitle}>Look for this in Termux:</Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>Server running on port 8081</Text>
            </View>
          </View>

          <View style={styles.tipBox}>
            <Text style={styles.tipTitle}>Keep Termux running!</Text>
            <Text style={styles.tipText}>
              Don't close Termux after starting the API. It needs to stay running in the background for the app to work.
            </Text>
          </View>
        </View>
      </SetupStep>
    );
  }

  return (
    <SetupStep
      title="Start the API Server"
      subtitle="One last step! Start the PocketAI server so this app can communicate with it."
      step={4}
      totalSteps={5}
      primaryAction={{
        label: 'Start API in Termux',
        onPress: handleStartApi,
      }}
      secondaryAction={{
        label: 'API Already Running',
        onPress: handleContinue,
      }}
    >
      <View style={styles.content}>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Tap the button below to open Termux with the API start command. This will start a local server that this app connects to.
          </Text>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Command (for reference)</Text>
          <View style={styles.dividerLine} />
        </View>

        <CommandBlock
          title="Start PocketAI API"
          command={SETUP_COMMANDS.startApi}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>If you see an error:</Text>
          <Text style={styles.sectionText}>
            Try this command first to activate the environment:
          </Text>
          <CommandBlock command={SETUP_COMMANDS.activateEnv} />
        </View>

        <View style={styles.dailyBox}>
          <Text style={styles.dailyTitle}>Daily Usage</Text>
          <Text style={styles.dailyText}>
            After phone restart, you'll need to start the API again. Use this command:
          </Text>
          <CommandBlock command={SETUP_COMMANDS.dailyStart} />
        </View>
      </View>
    </SetupStep>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  infoBox: {
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  sectionText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 22,
  },
  dailyBox: {
    backgroundColor: '#1a2d3d',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
    gap: spacing.sm,
  },
  dailyTitle: {
    color: colors.secondary,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  dailyText: {
    color: '#b0c4de',
    fontSize: fontSize.sm,
  },
  waitingBox: {
    backgroundColor: colors.primary + '20',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  waitingTitle: {
    color: colors.primary,
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  waitingText: {
    color: colors.text,
    fontSize: fontSize.md,
    lineHeight: 28,
  },
  successIndicator: {
    gap: spacing.sm,
  },
  successTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  codeBox: {
    backgroundColor: '#1a1a2e',
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  codeText: {
    color: colors.primary,
    fontFamily: 'monospace',
    fontSize: fontSize.sm,
  },
  tipBox: {
    backgroundColor: '#3d2914',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  tipTitle: {
    color: colors.warning,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  tipText: {
    color: '#f5d9b0',
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
});
