import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SetupStep } from '../../src/components/SetupStep';
import { openFDroidForTermux } from '../../src/services/termux';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';

export default function TermuxScreen() {
  const router = useRouter();

  const handleContinue = () => {
    router.push('/(setup)/install');
  };

  const handleDownload = async () => {
    await openFDroidForTermux();
  };

  return (
    <SetupStep
      title="Install Termux"
      subtitle="Termux is a terminal app that runs a Linux environment on Android. It's where the AI will run."
      step={2}
      totalSteps={5}
      primaryAction={{
        label: 'I Have Termux Installed',
        onPress: handleContinue,
      }}
      secondaryAction={{
        label: 'Download from F-Droid',
        onPress: handleDownload,
      }}
    >
      <View style={styles.content}>
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>Important</Text>
          <Text style={styles.warningText}>
            Download Termux from F-Droid, NOT the Play Store. The Play Store version is outdated and won't work properly.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What is Termux?</Text>
          <Text style={styles.sectionText}>
            Termux is a free terminal emulator that provides a Linux command-line environment on Android. It allows running powerful applications like AI models directly on your phone.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Steps to install:</Text>
          <View style={styles.steps}>
            <Text style={styles.stepText}>1. Tap "Download from F-Droid" below</Text>
            <Text style={styles.stepText}>2. Install F-Droid if you don't have it</Text>
            <Text style={styles.stepText}>3. Search for "Termux" and install it</Text>
            <Text style={styles.stepText}>4. Open Termux once to initialize it</Text>
            <Text style={styles.stepText}>5. Come back here and tap "I Have Termux Installed"</Text>
          </View>
        </View>

        <View style={styles.tipBox}>
          <Text style={styles.tipTitle}>Already have Termux?</Text>
          <Text style={styles.tipText}>
            If you already have Termux installed from F-Droid, just tap "I Have Termux Installed" to continue.
          </Text>
        </View>
      </View>
    </SetupStep>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  warningBox: {
    backgroundColor: '#3d2914',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  warningTitle: {
    color: colors.warning,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  warningText: {
    color: '#f5d9b0',
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
  sectionText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 22,
  },
  steps: {
    gap: spacing.sm,
    paddingLeft: spacing.sm,
  },
  stepText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 22,
  },
  tipBox: {
    backgroundColor: '#142d1a',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  tipTitle: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  tipText: {
    color: '#b0f0b0',
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
});
