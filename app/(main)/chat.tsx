import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '../../src/hooks/useChat';
import { useBackendStatus } from '../../src/hooks/useBackendStatus';
import { ChatBubble } from '../../src/components/ChatBubble';
import { ChatInput } from '../../src/components/ChatInput';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadows,
} from '../../src/constants/theme';
import { Message } from '../../src/types';

export default function ChatScreen() {
  const { messages, isLoading, error, send, clear } = useChat();
  const { connected, activeModel, refresh } = useBackendStatus();
  const flatListRef = useRef<FlatList>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [refreshing, setRefreshing] = useState(false);

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    // Small delay for visual feedback
    setTimeout(() => setRefreshing(false), 500);
  }, [refresh]);

  // Pulse animation for typing indicator
  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isLoading]);

  // Scroll to bottom when new message added
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleClearChat = () => {
    Alert.alert(
      'Clear Conversation',
      'This will delete all messages. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clear },
      ]
    );
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <ChatBubble message={item} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="sparkles" size={36} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>Welcome to PocketAI</Text>
      <Text style={styles.emptySubtitle}>
        Your private AI assistant running locally on your device.
      </Text>
      <Text style={styles.emptyHint}>
        Start a conversation below. All chats stay on your phone.
      </Text>
      {!connected && (
        <View style={styles.warningCard}>
          <Ionicons name="warning" size={20} color={colors.warning} />
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Backend Offline</Text>
            <Text style={styles.warningText}>
              Run "pai api web" in Termux to connect
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.headerTitle}>PocketAI</Text>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    connected ? styles.statusOnline : styles.statusOffline,
                  ]}
                />
                <Text style={styles.statusText}>
                  {connected ? 'Connected' : 'Offline'}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              onPress={onRefresh}
              style={styles.headerButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name="refresh"
                size={18}
                color={refreshing ? colors.primary : colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleClearChat}
              style={styles.headerButton}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Active model chip */}
        {activeModel && (
          <View style={styles.modelChip}>
            <View style={styles.modelDot} />
            <Text style={styles.modelText} numberOfLines={1}>
              {activeModel}
            </Text>
          </View>
        )}

        {/* Error banner */}
        {error && !isLoading && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.messageList,
            messages.length === 0 && styles.messageListEmpty,
          ]}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressBackgroundColor={colors.surface}
            />
          }
        />

        {/* Typing indicator */}
        {isLoading && (
          <View style={styles.typingContainer}>
            <View style={styles.typingBubble}>
              <Animated.View style={[styles.typingDots, { opacity: pulseAnim }]}>
                <View style={styles.typingDot} />
                <View style={[styles.typingDot, styles.typingDotMiddle]} />
                <View style={styles.typingDot} />
              </Animated.View>
              <Text style={styles.typingText}>AI is thinking...</Text>
            </View>
          </View>
        )}

        {/* Input */}
        <ChatInput
          onSend={send}
          isLoading={isLoading}
          disabled={!connected}
          placeholder={connected ? 'Message PocketAI...' : 'Backend not connected...'}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
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
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusOnline: {
    backgroundColor: colors.success,
  },
  statusOffline: {
    backgroundColor: colors.textMuted,
  },
  statusText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primaryMuted,
    borderRadius: borderRadius.pill,
    gap: spacing.xs,
  },
  modelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  modelText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  errorBanner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.errorMuted,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
  },
  messageList: {
    paddingVertical: spacing.md,
    flexGrow: 1,
  },
  messageListEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  emptyHint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningMuted,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    color: colors.warning,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  warningText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  typingContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    gap: spacing.sm,
    ...shadows.sm,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  typingDotMiddle: {
    marginHorizontal: 2,
  },
  typingText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontStyle: 'italic',
  },
});
