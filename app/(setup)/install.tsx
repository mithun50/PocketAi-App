import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SetupStep } from '../../src/components/SetupStep';
import { CommandBlock } from '../../src/components/CommandBlock';
import { runSetupInTermux } from '../../src/services/termux';
import { SETUP_COMMANDS } from '../../src/constants/commands';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';

export default function InstallScreen() {
  const router = useRouter();
  const [commandSent, setCommandSent] = useState(false);

  const handleRunInTermux = async () => {
    const result = await runSetupInTermux();

    if (result.success) {
      setCommandSent(true);
    } else {
      Alert.alert(
        'Termux Not Found',
        'Please install Termux from F-Droid first.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleContinue = () => {
    router.push('/(setup)/start-api');
  };

  // Show different UI after command is sent
  if (commandSent) {
    return (
      <SetupStep
        title="Setup Running..."
        subtitle="The setup command is running in Termux. Come back here when it's done."
        step={3}
        totalSteps={5}
        primaryAction={{
          label: 'Setup Complete - Continue',
          onPress: handleContinue,
        }}
        secondaryAction={{
          label: 'Run Command Again',
          onPress: handleRunInTermux,
        }}
      >
        <View style={styles.content}>
          <View style={styles.waitingBox}>
            <Text style={styles.waitingTitle}>Waiting for you...</Text>
            <Text style={styles.waitingText}>
              1. Switch to Termux app{'\n'}
              2. Long-press and tap "Paste"{'\n'}
              3. Press Enter to run the command{'\n'}
              4. Wait for setup to complete (~2-5 min){'\n'}
              5. Come back here and tap "Continue"
            </Text>
          </View>

          <View style={styles.tipBox}>
            <Text style={styles.tipTitle}>How to switch back</Text>
            <Text style={styles.tipText}>
              Swipe up from bottom (or tap the square button) to see recent apps, then tap this app to return.
            </Text>
          </View>
        </View>
      </SetupStep>
    );
  }

  return (
    <SetupStep
      title="Install PocketAI"
      subtitle="Install PocketAI in Termux to run AI models locally."
      step={3}
      totalSteps={5}
      primaryAction={{
        label: 'Run Setup in Termux',
        onPress: handleRunInTermux,
      }}
      secondaryAction={{
        label: 'Already Installed - Skip',
        onPress: handleContinue,
      }}
    >
      <View style={styles.content}>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Tap the button below to open Termux with the setup command. The command will be copied - just paste it in Termux.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What will be installed:</Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Git and dependencies</Text>
            <Text style={styles.listItem}>• PocketAI framework</Text>
            <Text style={styles.listItem}>• An AI model of your choice</Text>
          </View>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Commands (for reference)</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.commands}>
          <CommandBlock
            title="Full setup command"
            command={SETUP_COMMANDS.fullSetup || `${SETUP_COMMANDS.installGit} && ${SETUP_COMMANDS.cloneRepo} && ${SETUP_COMMANDS.runSetup}`}
          />
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
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  list: {
    gap: spacing.xs,
    paddingLeft: spacing.sm,
  },
  listItem: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
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
  commands: {
    gap: spacing.md,
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
  tipBox: {
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  tipTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  tipText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
});
