import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Switch,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useBackendStatus } from '../../src/hooks/useBackendStatus';
import { getConfig, setConfig } from '../../src/services/api';
import { clearChatHistory } from '../../src/services/storage';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadows,
} from '../../src/constants/theme';

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  isDestructive?: boolean;
  rightElement?: React.ReactNode;
}

function SettingItem({
  icon,
  title,
  subtitle,
  value,
  onPress,
  isDestructive,
  rightElement,
}: SettingItemProps) {
  return (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.settingIcon, isDestructive && styles.destructiveIcon]}>
        <Ionicons
          name={icon}
          size={20}
          color={isDestructive ? colors.error : colors.primary}
        />
      </View>
      <View style={styles.settingContent}>
        <Text
          style={[styles.settingTitle, isDestructive && styles.destructiveText]}
        >
          {title}
        </Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement || (
        value && <Text style={styles.settingValue}>{value}</Text>
      )}
      {onPress && !rightElement && (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      )}
    </TouchableOpacity>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const { connected, version, activeModel, refresh } = useBackendStatus();
  const [threads, setThreads] = useState('4');
  const [contextSize, setContextSize] = useState('2048');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (connected) {
      loadConfig();
    }
  }, [connected]);

  const loadConfig = async () => {
    const result = await getConfig();
    if (result.success && result.data) {
      if (result.data.threads) setThreads(result.data.threads);
      if (result.data.context_size) setContextSize(result.data.context_size);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    await loadConfig();
    setTimeout(() => setRefreshing(false), 500);
  }, [refresh]);

  const handleClearHistory = () => {
    Alert.alert(
      'Clear Chat History',
      'This will permanently delete all your chat messages. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearChatHistory();
            Alert.alert('Done', 'Chat history cleared successfully.');
          },
        },
      ]
    );
  };

  const handleOpenGitHub = () => {
    Linking.openURL('https://github.com/mithun50/PocketAi');
  };

  const handleThreadsChange = async () => {
    Alert.alert(
      'CPU Threads',
      'Select the number of CPU threads for inference.',
      [
        { text: '2', onPress: () => updateSetting('threads', '2') },
        { text: '4', onPress: () => updateSetting('threads', '4') },
        { text: '6', onPress: () => updateSetting('threads', '6') },
        { text: '8', onPress: () => updateSetting('threads', '8') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleContextChange = async () => {
    Alert.alert(
      'Context Size',
      'Larger context allows longer conversations but uses more memory.',
      [
        { text: '1024', onPress: () => updateSetting('context_size', '1024') },
        { text: '2048', onPress: () => updateSetting('context_size', '2048') },
        { text: '4096', onPress: () => updateSetting('context_size', '4096') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const updateSetting = async (key: string, value: string) => {
    const result = await setConfig(key, value);
    if (result.success) {
      if (key === 'threads') setThreads(value);
      if (key === 'context_size') setContextSize(value);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Configure PocketAI</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surface}
          />
        }
      >
        {/* Status Card */}
        <View style={[styles.statusCard, connected ? styles.statusOnline : styles.statusOffline]}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusDot, connected ? styles.dotOnline : styles.dotOffline]} />
            <Text style={styles.statusLabel}>
              {connected ? 'Backend Online' : 'Backend Offline'}
            </Text>
          </View>
          {connected && (
            <View style={styles.statusDetails}>
              <View style={styles.statusRow}>
                <Text style={styles.statusKey}>Version</Text>
                <Text style={styles.statusValue}>{version || 'Unknown'}</Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusKey}>Active Model</Text>
                <Text style={styles.statusValue} numberOfLines={1}>
                  {activeModel || 'None'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Performance Section */}
        <SectionHeader title="Performance" />
        <View style={styles.card}>
          <SettingItem
            icon="flash-outline"
            title="CPU Threads"
            subtitle="Number of threads for inference"
            value={threads}
            onPress={connected ? handleThreadsChange : undefined}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="hardware-chip-outline"
            title="Context Size"
            subtitle="Maximum conversation length"
            value={contextSize}
            onPress={connected ? handleContextChange : undefined}
          />
        </View>

        {/* Data Section */}
        <SectionHeader title="Data" />
        <View style={styles.card}>
          <SettingItem
            icon="trash-outline"
            title="Clear Chat History"
            subtitle="Delete all saved messages"
            onPress={handleClearHistory}
            isDestructive
          />
        </View>

        {/* About Section */}
        <SectionHeader title="About" />
        <View style={styles.card}>
          <SettingItem
            icon="phone-portrait-outline"
            title="PocketAI"
            subtitle="Offline AI for Android"
            value="v1.0.0"
          />
          <View style={styles.divider} />
          <SettingItem
            icon="logo-github"
            title="GitHub"
            subtitle="View source code"
            onPress={handleOpenGitHub}
          />
        </View>

        {/* Credits */}
        <View style={styles.credits}>
          <View style={styles.creditsRow}>
            <Text style={styles.creditsText}>Made with </Text>
            <Ionicons name="heart" size={14} color={colors.error} />
            <Text style={styles.creditsText}> for privacy</Text>
          </View>
          <Text style={styles.creditsSubtext}>
            All AI processing happens on your device
          </Text>
        </View>

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xxs,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  statusCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    ...shadows.md,
  },
  statusOnline: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  statusOffline: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotOnline: {
    backgroundColor: colors.primary,
  },
  dotOffline: {
    backgroundColor: colors.textMuted,
  },
  statusLabel: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  statusDetails: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusKey: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  statusValue: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    maxWidth: '60%',
    textAlign: 'right',
  },
  sectionHeader: {
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  destructiveIcon: {
    backgroundColor: colors.errorMuted,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  settingSubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xxs,
  },
  settingValue: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  destructiveText: {
    color: colors.error,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.lg + 36 + spacing.md,
  },
  credits: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  creditsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creditsText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  creditsSubtext: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  bottomPadding: {
    height: spacing.xl,
  },
});
