import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SetupStep } from '../../src/components/SetupStep';
import { openFDroidForTermux, isTermuxInstalled } from '../../src/services/termux';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';

export default function TermuxScreen() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [termuxFound, setTermuxFound] = useState(false);

  useEffect(() => {
    checkTermux();
  }, []);

  const checkTermux = async () => {
    setChecking(true);
    const installed = await isTermuxInstalled();
    setTermuxFound(installed);
    setChecking(false);

    // Auto-continue if Termux is found
    if (installed) {
      setTimeout(() => {
        router.push('/(setup)/install');
      }, 1500);
    }
  };

  const handleContinue = () => {
    router.push('/(setup)/install');
  };

  const handleDownload = async () => {
    await openFDroidForTermux();
  };

  // Show loading state
  if (checking) {
    return (
      <SetupStep
        title="Checking for Termux..."
        subtitle="Please wait while we check if Termux is installed."
        step={2}
        totalSteps={5}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Detecting Termux...</Text>
        </View>
      </SetupStep>
    );
  }

  // Termux is installed - show success and auto-continue
  if (termuxFound) {
    return (
      <SetupStep
        title="Termux Found!"
        subtitle="Great! Termux is already installed on your device."
        step={2}
        totalSteps={5}
        primaryAction={{
          label: 'Continue',
          onPress: handleContinue,
        }}
      >
        <View style={styles.content}>
          <View style={styles.successBox}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successTitle}>Termux Detected</Text>
            <Text style={styles.successText}>
              Continuing to the next step automatically...
            </Text>
          </View>
        </View>
      </SetupStep>
    );
  }

  // Termux not installed - show installation guide
  return (
    <SetupStep
      title="Install Termux"
      subtitle="Termux is required to run AI models locally. Please install it from F-Droid."
      step={2}
      totalSteps={5}
      primaryAction={{
        label: 'Download from F-Droid',
        onPress: handleDownload,
      }}
      secondaryAction={{
        label: 'I Have Installed It - Check Again',
        onPress: checkTermux,
      }}
    >
      <View style={styles.content}>
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>Termux Not Found</Text>
          <Text style={styles.warningText}>
            Termux is not installed on your device. Please install it from F-Droid (NOT the Play Store).
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why F-Droid?</Text>
          <Text style={styles.sectionText}>
            The Play Store version of Termux is outdated and no longer maintained. The F-Droid version is actively updated and works correctly.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Steps to install:</Text>
          <View style={styles.steps}>
            <Text style={styles.stepText}>1. Tap "Download from F-Droid" below</Text>
            <Text style={styles.stepText}>2. Install F-Droid app if prompted</Text>
            <Text style={styles.stepText}>3. Search for "Termux" in F-Droid</Text>
            <Text style={styles.stepText}>4. Install Termux and open it once</Text>
            <Text style={styles.stepText}>5. Return here and tap "Check Again"</Text>
          </View>
        </View>

        <View style={styles.tipBox}>
          <Text style={styles.tipTitle}>What is Termux?</Text>
          <Text style={styles.tipText}>
            Termux is a terminal app that runs a Linux environment on Android. It allows running powerful applications like AI models directly on your phone - completely offline!
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.lg,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
  successBox: {
    backgroundColor: colors.primaryMuted,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    gap: spacing.md,
  },
  successIcon: {
    fontSize: 48,
    color: colors.primary,
  },
  successTitle: {
    color: colors.primary,
    fontSize: fontSize.xl,
    fontWeight: '600',
  },
  successText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: 'center',
  },
  warningBox: {
    backgroundColor: colors.errorMuted,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  warningTitle: {
    color: colors.error,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  warningText: {
    color: '#f5b0b0',
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
    backgroundColor: colors.primaryMuted,
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
