import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  shadows,
} from '../constants/theme';

interface StatusIndicatorProps {
  connected: boolean;
  version?: string;
  model?: string;
  compact?: boolean;
}

export function StatusIndicator({
  connected,
  version,
  model,
  compact = false,
}: StatusIndicatorProps) {
  if (compact) {
    return (
      <View
        style={[
          styles.compactContainer,
          connected ? styles.compactOnline : styles.compactOffline,
        ]}
      >
        <View
          style={[
            styles.dot,
            connected ? styles.dotConnected : styles.dotDisconnected,
          ]}
        />
        <Text
          style={[
            styles.compactText,
            connected ? styles.textOnline : styles.textOffline,
          ]}
        >
          {connected ? 'Online' : 'Offline'}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        connected ? styles.containerOnline : styles.containerOffline,
      ]}
    >
      <View style={styles.row}>
        <View
          style={[
            styles.dot,
            connected ? styles.dotConnected : styles.dotDisconnected,
          ]}
        />
        <Text style={styles.statusText}>
          {connected ? 'Backend Connected' : 'Backend Disconnected'}
        </Text>
      </View>
      {connected && version && (
        <Text style={styles.infoText}>Version: {version}</Text>
      )}
      {connected && model && (
        <Text style={styles.infoText}>Model: {model}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    ...shadows.sm,
  },
  containerOnline: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  containerOffline: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
    gap: spacing.xs,
  },
  compactOnline: {
    backgroundColor: colors.primaryMuted,
  },
  compactOffline: {
    backgroundColor: colors.surfaceElevated,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotConnected: {
    backgroundColor: colors.success,
  },
  dotDisconnected: {
    backgroundColor: colors.textMuted,
  },
  statusText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginLeft: spacing.sm,
  },
  compactText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  textOnline: {
    color: colors.primary,
  },
  textOffline: {
    color: colors.textMuted,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
    marginLeft: spacing.lg + 8,
  },
});
