import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  shadows,
} from '../constants/theme';
import { ProgressBar } from './ProgressBar';

interface ModelCardProps {
  name: string;
  description?: string;
  size?: string;
  ram?: string;
  installed?: boolean;
  active?: boolean;
  downloading?: boolean;
  progress?: number;
  onInstall?: () => void;
  onActivate?: () => void;
  onDelete?: () => void;
}

export function ModelCard({
  name,
  description,
  size,
  ram,
  installed = false,
  active = false,
  downloading = false,
  progress = 0,
  onInstall,
  onActivate,
  onDelete,
}: ModelCardProps) {
  const handleDelete = () => {
    Alert.alert(
      'Remove Model',
      `Are you sure you want to remove ${name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: onDelete,
        },
      ]
    );
  };

  const handlePress = () => {
    if (installed && !active && onActivate) {
      onActivate();
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        active && styles.activeContainer,
        pressed && installed && !active && styles.pressed,
      ]}
      onPress={handlePress}
      disabled={!installed || active}
    >
      {/* Active indicator bar */}
      {active && <View style={styles.activeBar} />}

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>
              {name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.titleContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.name} numberOfLines={1}>
                {name}
              </Text>
              {active && (
                <View style={styles.activeBadge}>
                  <View style={styles.activeDot} />
                  <Text style={styles.activeBadgeText}>Active</Text>
                </View>
              )}
            </View>
            {description && (
              <Text style={styles.description} numberOfLines={1}>
                {description}
              </Text>
            )}
          </View>
        </View>

        {/* Meta info */}
        <View style={styles.meta}>
          {size && (
            <View style={styles.metaChip}>
              <Ionicons name="save-outline" size={12} color={colors.textSecondary} />
              <Text style={styles.metaValue}>{size}</Text>
            </View>
          )}
          {ram && (
            <View style={styles.metaChip}>
              <Ionicons name="hardware-chip-outline" size={12} color={colors.textSecondary} />
              <Text style={styles.metaValue}>{ram}</Text>
            </View>
          )}
          {installed && (
            <View style={[styles.metaChip, styles.installedChip]}>
              <Ionicons name="checkmark-circle" size={12} color={colors.primary} />
              <Text style={styles.installedText}>Installed</Text>
            </View>
          )}
        </View>

        {/* Progress bar */}
        {downloading && (
          <View style={styles.progressContainer}>
            <ProgressBar progress={progress} label="Installing..." />
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {installed ? (
            <>
              {!active && onActivate && (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={onActivate}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryButtonText}>Activate</Text>
                </TouchableOpacity>
              )}
              {active && (
                <View style={styles.activeButton}>
                  <Text style={styles.activeButtonText}>Currently Active</Text>
                </View>
              )}
              {onDelete && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDelete}
                  activeOpacity={0.7}
                >
                  <Text style={styles.deleteButtonText}>Remove</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            onInstall && (
              <TouchableOpacity
                style={[
                  styles.installButton,
                  downloading && styles.disabledButton,
                ]}
                onPress={onInstall}
                disabled={downloading}
                activeOpacity={0.8}
              >
                <Text style={styles.installButtonText}>
                  {downloading ? 'Installing...' : 'Download & Install'}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
  activeContainer: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
  activeBar: {
    height: 3,
    backgroundColor: colors.primary,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  iconText: {
    color: colors.primary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  titleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    flex: 1,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
    gap: spacing.xs,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textInverse,
  },
  activeBadgeText: {
    color: colors.textInverse,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: spacing.xxs,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  metaValue: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  installedChip: {
    backgroundColor: colors.primaryMuted,
  },
  installedText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  progressContainer: {
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  primaryButtonText: {
    color: colors.textInverse,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  activeButton: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  activeButtonText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  deleteButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  deleteButtonText: {
    color: colors.error,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  installButton: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  installButtonText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  disabledButton: {
    opacity: 0.6,
    borderColor: colors.border,
  },
});
