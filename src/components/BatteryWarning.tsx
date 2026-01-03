import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';

interface BatteryWarningProps {
  visible?: boolean;
  onDismiss?: () => void;
}

// Device brand detection based on manufacturer
function getDeviceBrand(): string {
  // React Native doesn't expose manufacturer directly, but we can check via constants
  // This is a simplified approach - in production you'd use react-native-device-info
  return 'generic';
}

interface BrandInstructions {
  brand: string;
  steps: string[];
  settingsAction?: string;
}

const BRAND_INSTRUCTIONS: Record<string, BrandInstructions> = {
  xiaomi: {
    brand: 'Xiaomi/Redmi',
    steps: [
      'Settings → Apps → Manage apps → Termux',
      'Tap "Battery saver" → Select "No restrictions"',
      'Also enable "Autostart" permission',
      'Lock Termux in Recent Apps (swipe down on app card)',
    ],
    settingsAction: 'android.settings.APPLICATION_DETAILS_SETTINGS',
  },
  samsung: {
    brand: 'Samsung',
    steps: [
      'Settings → Apps → Termux → Battery',
      'Select "Unrestricted"',
      'Also check: Settings → Battery → Background usage limits',
      'Remove Termux from "Sleeping apps"',
    ],
    settingsAction: 'android.settings.APPLICATION_DETAILS_SETTINGS',
  },
  oppo: {
    brand: 'Oppo/Realme',
    steps: [
      'Settings → Battery → Power saving options',
      'Tap Termux → Select "Allow background activity"',
      'Also enable "Auto-launch" in App management',
    ],
    settingsAction: 'android.settings.APPLICATION_DETAILS_SETTINGS',
  },
  vivo: {
    brand: 'Vivo',
    steps: [
      'Settings → Battery → Background power consumption',
      'Find Termux → Allow background running',
      'Also: Settings → More settings → Applications → Autostart',
    ],
    settingsAction: 'android.settings.APPLICATION_DETAILS_SETTINGS',
  },
  huawei: {
    brand: 'Huawei',
    steps: [
      'Settings → Battery → App launch',
      'Find Termux → Disable "Manage automatically"',
      'Enable all three: Auto-launch, Secondary launch, Run in background',
    ],
    settingsAction: 'android.settings.APPLICATION_DETAILS_SETTINGS',
  },
  oneplus: {
    brand: 'OnePlus',
    steps: [
      'Settings → Battery → Battery optimization',
      'Tap Termux → Select "Don\'t optimize"',
      'Also check Settings → Apps → Termux → Battery',
    ],
    settingsAction: 'android.settings.APPLICATION_DETAILS_SETTINGS',
  },
  generic: {
    brand: 'Android',
    steps: [
      'Settings → Apps → Termux → Battery',
      'Select "Unrestricted" or "No restrictions"',
      'Disable any battery optimization for Termux',
      'Keep Termux visible or locked in Recent Apps',
    ],
    settingsAction: 'android.settings.APPLICATION_DETAILS_SETTINGS',
  },
};

export function BatteryWarning({ visible = true, onDismiss }: BatteryWarningProps) {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!visible || dismissed || Platform.OS !== 'android') {
    return null;
  }

  const brand = getDeviceBrand();
  const instructions = BRAND_INSTRUCTIONS[brand] || BRAND_INSTRUCTIONS.generic;

  const openBatterySettings = async () => {
    try {
      // Try to open Termux app settings directly
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
        {
          data: 'package:com.termux',
        }
      );
    } catch (error) {
      // Fallback to general battery settings
      try {
        await IntentLauncher.startActivityAsync(
          IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS
        );
      } catch (e) {
        // Last resort - open app settings
        Linking.openSettings();
      }
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon}>🔋</Text>
        <View style={styles.headerText}>
          <Text style={styles.title}>Battery Optimization Warning</Text>
          <Text style={styles.subtitle}>
            Your phone may kill Termux in the background
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.expandButton}
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={styles.expandText}>
          {expanded ? '▼ Hide instructions' : '▶ Show how to fix'}
        </Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.instructions}>
          <Text style={styles.brandTitle}>For {instructions.brand}:</Text>
          {instructions.steps.map((step, index) => (
            <Text key={index} style={styles.step}>
              {index + 1}. {step}
            </Text>
          ))}

          <TouchableOpacity style={styles.settingsButton} onPress={openBatterySettings}>
            <Text style={styles.settingsButtonText}>Open Termux Settings</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
          <Text style={styles.dismissText}>I've done this</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#3d2914',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    marginVertical: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  icon: {
    fontSize: 24,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: colors.warning,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  subtitle: {
    color: '#f5d9b0',
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  expandButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },
  expandText: {
    color: colors.warning,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  instructions: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(245, 217, 176, 0.2)',
  },
  brandTitle: {
    color: '#f5d9b0',
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  step: {
    color: '#f5d9b0',
    fontSize: fontSize.sm,
    lineHeight: 22,
    marginLeft: spacing.xs,
    marginBottom: 4,
  },
  settingsButton: {
    backgroundColor: colors.warning,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  settingsButtonText: {
    color: '#1a1a1a',
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
  },
  dismissButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  dismissText: {
    color: '#f5d9b0',
    fontSize: fontSize.sm,
    opacity: 0.8,
  },
});
