import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, fontSize } from '../constants/theme';

interface SetupStepProps {
  title: string;
  subtitle?: string;
  step: number;
  totalSteps: number;
  children: React.ReactNode;
  primaryAction?: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
}

export function SetupStep({
  title,
  subtitle,
  step,
  totalSteps,
  children,
  primaryAction,
  secondaryAction,
}: SetupStepProps) {
  return (
    <SafeAreaView style={styles.container}>
      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              i < step && styles.progressDotCompleted,
              i === step - 1 && styles.progressDotActive,
            ]}
          />
        ))}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.stepLabel}>Step {step} of {totalSteps}</Text>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        {secondaryAction && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={secondaryAction.onPress}
          >
            <Text style={styles.secondaryButtonText}>
              {secondaryAction.label}
            </Text>
          </TouchableOpacity>
        )}
        {primaryAction && (
          <TouchableOpacity
            style={[
              styles.primaryButton,
              primaryAction.disabled && styles.primaryButtonDisabled,
            ]}
            onPress={primaryAction.onPress}
            disabled={primaryAction.disabled}
          >
            <Text style={styles.primaryButtonText}>{primaryAction.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceLight,
  },
  progressDotCompleted: {
    backgroundColor: colors.primary,
  },
  progressDotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  stepLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    marginTop: spacing.sm,
    lineHeight: 24,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  actions: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: colors.surfaceLight,
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.secondary,
    fontSize: fontSize.md,
  },
});
