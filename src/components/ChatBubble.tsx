import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  shadows,
} from '../constants/theme';
import { Message } from '../types';

interface ChatBubbleProps {
  message: Message;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  const handleLongPress = async () => {
    await Clipboard.setStringAsync(message.content);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.aiContainer]}>
      {/* Avatar for AI */}
      {!isUser && (
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="sparkles" size={16} color={colors.primary} />
          </View>
        </View>
      )}

      <View style={styles.messageWrapper}>
        {/* Label */}
        <Text style={[styles.label, isUser ? styles.userLabel : styles.aiLabel]}>
          {isUser ? 'You' : 'PocketAI'}
        </Text>

        {/* Bubble */}
        <Pressable
          onLongPress={handleLongPress}
          style={({ pressed }) => [
            styles.bubble,
            isUser ? styles.userBubble : styles.aiBubble,
            pressed && styles.bubblePressed,
          ]}
        >
          <Text
            style={[styles.text, isUser ? styles.userText : styles.aiText]}
            selectable={true}
          >
            {message.content}
          </Text>
        </Pressable>

        {/* Timestamp */}
        <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.aiTimestamp]}>
          {formatTime(message.timestamp)}
        </Text>
      </View>

      {/* Avatar for User */}
      {isUser && (
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, styles.userAvatar]}>
            <Ionicons name="person" size={16} color={colors.textInverse} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    maxWidth: '100%',
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  aiContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginTop: spacing.xl,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatar: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  messageWrapper: {
    maxWidth: '80%',
    marginHorizontal: spacing.sm,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
    marginHorizontal: spacing.xs,
  },
  userLabel: {
    color: colors.textMuted,
    textAlign: 'right',
  },
  aiLabel: {
    color: colors.primary,
    textAlign: 'left',
  },
  bubble: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadows.sm,
  },
  userBubble: {
    backgroundColor: colors.userBubble,
    borderRadius: borderRadius.xl,
    borderBottomRightRadius: spacing.xs,
  },
  aiBubble: {
    backgroundColor: colors.aiBubble,
    borderRadius: borderRadius.xl,
    borderBottomLeftRadius: spacing.xs,
    borderWidth: 1,
    borderColor: colors.aiBubbleBorder,
  },
  bubblePressed: {
    opacity: 0.8,
  },
  text: {
    fontSize: fontSize.md,
    lineHeight: fontSize.md * 1.5,
  },
  userText: {
    color: colors.textInverse,
  },
  aiText: {
    color: colors.text,
  },
  timestamp: {
    fontSize: fontSize.xxs,
    marginTop: spacing.xs,
    marginHorizontal: spacing.xs,
  },
  userTimestamp: {
    color: colors.textMuted,
    textAlign: 'right',
  },
  aiTimestamp: {
    color: colors.textMuted,
    textAlign: 'left',
  },
});
