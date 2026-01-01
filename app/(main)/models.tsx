import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useModels } from '../../src/hooks/useModels';
import { useBackendStatus } from '../../src/hooks/useBackendStatus';
import { ModelCard } from '../../src/components/ModelCard';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadows,
} from '../../src/constants/theme';

export default function ModelsScreen() {
  const {
    availableModels,
    installedModels,
    loading,
    error,
    downloadState,
    refresh,
    installModel,
    removeModel,
    activateModel,
  } = useModels();

  const { connected, activeModel } = useBackendStatus();

  const getModelDetails = (modelName: string) => {
    const cleanName = modelName.replace('.gguf', '').split('-')[0].toLowerCase();
    return availableModels.find(
      (m) => m.name.toLowerCase() === cleanName || modelName.toLowerCase().includes(m.name.toLowerCase())
    );
  };

  if (!connected) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.headerTitle}>Models</Text>
              <Text style={styles.headerSubtitle}>Manage AI models</Text>
            </View>
          </View>
        </View>
        <View style={styles.disconnectedContainer}>
          <View style={styles.disconnectedIcon}>
            <Ionicons name="warning" size={36} color={colors.warning} />
          </View>
          <Text style={styles.disconnectedTitle}>Backend Offline</Text>
          <Text style={styles.disconnectedText}>
            Start the PocketAI API in Termux to manage models.
          </Text>
          <View style={styles.commandBox}>
            <Text style={styles.commandText}>pai api web</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.headerTitle}>Models</Text>
            <Text style={styles.headerSubtitle}>
              {installedModels.length} installed
            </Text>
          </View>
        </View>
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Connected</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Error message */}
        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Active Model Card */}
        {activeModel && (
          <View style={styles.activeCard}>
            <View style={styles.activeCardHeader}>
              <View style={styles.activeIcon}>
                <Ionicons name="sparkles" size={22} color={colors.textInverse} />
              </View>
              <View style={styles.activeInfo}>
                <Text style={styles.activeLabel}>Currently Active</Text>
                <Text style={styles.activeName} numberOfLines={1}>
                  {activeModel}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Installed Models */}
        {installedModels.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Installed</Text>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{installedModels.length}</Text>
              </View>
            </View>
            {installedModels.map((model) => {
              const details = getModelDetails(model.name);
              const isActive = activeModel === model.name;
              return (
                <ModelCard
                  key={model.name}
                  name={model.name}
                  description={details?.description}
                  size={model.size || details?.size}
                  ram={details?.ram}
                  installed={true}
                  active={isActive}
                  onActivate={() => activateModel(model.name)}
                  onDelete={() => removeModel(model.name)}
                />
              );
            })}
          </View>
        )}

        {/* Available Models */}
        {availableModels.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Available</Text>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{availableModels.length}</Text>
              </View>
            </View>
            <Text style={styles.sectionDescription}>
              Download models to use them offline
            </Text>
            {availableModels
              .filter(
                (model) =>
                  !installedModels.some((im) =>
                    im.name.toLowerCase().includes(model.name.toLowerCase())
                  )
              )
              .map((model) => (
                <ModelCard
                  key={model.name}
                  name={model.name}
                  description={model.description}
                  size={model.size}
                  ram={model.ram}
                  installed={false}
                  downloading={downloadState.modelName === model.name}
                  progress={
                    downloadState.modelName === model.name
                      ? downloadState.progress
                      : 0
                  }
                  onInstall={() => installModel(model.name)}
                />
              ))}
          </View>
        )}

        {/* Loading state */}
        {loading && installedModels.length === 0 && availableModels.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading models...</Text>
          </View>
        )}

        {/* Empty state */}
        {!loading && installedModels.length === 0 && availableModels.length === 0 && (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="cube-outline" size={36} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No Models Available</Text>
            <Text style={styles.emptyText}>
              Pull down to refresh and load available models.
            </Text>
          </View>
        )}

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerLogo: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
    gap: spacing.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  statusText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  errorCard: {
    backgroundColor: colors.errorMuted,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
  },
  activeCard: {
    backgroundColor: colors.primaryMuted,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary,
    ...shadows.md,
  },
  activeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  activeInfo: {
    flex: 1,
  },
  activeLabel: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activeName: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.xxs,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  sectionBadge: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
  },
  sectionBadgeText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  sectionDescription: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.huge,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    marginTop: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.huge,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  disconnectedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  disconnectedIcon: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.warningMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  disconnectedTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.sm,
  },
  disconnectedText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  commandBox: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commandText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontFamily: 'monospace',
    fontWeight: fontWeight.medium,
  },
  bottomPadding: {
    height: spacing.xl,
  },
});
