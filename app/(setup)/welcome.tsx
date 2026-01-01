import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SetupStep } from '../../src/components/SetupStep';
import { colors, spacing, fontSize } from '../../src/constants/theme';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SetupStep
      title="Welcome to PocketAI"
      subtitle="Run AI models directly on your phone. No cloud, no subscriptions, completely offline."
      step={1}
      totalSteps={5}
      primaryAction={{
        label: 'Get Started',
        onPress: () => router.push('/(setup)/termux'),
      }}
    >
      <View style={styles.features}>
        <FeatureItem
          icon="*"
          title="Fully Offline"
          description="All AI processing happens on your device. No internet required after setup."
        />
        <FeatureItem
          icon="*"
          title="Privacy First"
          description="Your conversations never leave your phone. Complete data privacy."
        />
        <FeatureItem
          icon="*"
          title="Multiple Models"
          description="Choose from various AI models optimized for different use cases."
        />
        <FeatureItem
          icon="*"
          title="Free Forever"
          description="No subscriptions, no API costs. Just your phone and AI."
        />
      </View>
    </SetupStep>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <Text style={styles.featureIconText}>{icon}</Text>
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  features: {
    gap: spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  featureIcon: {
    width: 40,
    height: 40,
    backgroundColor: colors.surfaceLight,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureIconText: {
    color: colors.primary,
    fontSize: fontSize.lg,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  featureDescription: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
});
