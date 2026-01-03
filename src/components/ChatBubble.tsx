import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Animated } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
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
  isStreaming?: boolean;
  usedFallback?: boolean;
}

// Pulsing dot for streaming indicator
function PulsingDot() {
  const scale = useState(new Animated.Value(1))[0];
  const opacity = useState(new Animated.Value(1))[0];

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.6,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [scale, opacity]);

  return (
    <Animated.View
      style={[
        streamingStyles.streamingDot,
        { transform: [{ scale }], opacity }
      ]}
    />
  );
}

// Animated blinking cursor component for streaming effect
function StreamingCursor() {
  const opacity = useState(new Animated.Value(1))[0];
  const scale = useState(new Animated.Value(1))[0];

  useEffect(() => {
    const blinkAnimation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 0.8,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    blinkAnimation.start();
    return () => blinkAnimation.stop();
  }, [opacity, scale]);

  return (
    <Animated.View style={[streamingStyles.cursorContainer, { opacity, transform: [{ scale }] }]}>
      <View style={streamingStyles.cursorBar} />
    </Animated.View>
  );
}

// Parse thinking blocks from Qwen3 responses
function parseThinkingBlocks(content: string): { thinking: string | null; response: string } {
  const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
  if (thinkMatch) {
    const thinking = thinkMatch[1].trim();
    const response = content.replace(/<think>[\s\S]*?<\/think>/, '').trim();
    return { thinking, response };
  }
  // Check for incomplete thinking block (still streaming)
  const incompleteMatch = content.match(/<think>([\s\S]*?)$/);
  if (incompleteMatch) {
    return { thinking: incompleteMatch[1].trim(), response: '' };
  }
  return { thinking: null, response: content };
}

// Collapsible Thinking Block Component
function ThinkingBlock({ content, isStreaming }: { content: string; isStreaming: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const rotateAnim = useState(new Animated.Value(0))[0];

  const toggleExpand = () => {
    Animated.timing(rotateAnim, {
      toValue: expanded ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setExpanded(!expanded);
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={thinkingStyles.container}>
      <Pressable onPress={toggleExpand} style={thinkingStyles.header}>
        <View style={thinkingStyles.headerLeft}>
          <Ionicons name="bulb-outline" size={14} color={colors.accent} />
          <Text style={thinkingStyles.headerText}>
            {isStreaming ? 'Thinking...' : 'Thought Process'}
          </Text>
          {isStreaming && <PulsingDot />}
        </View>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
        </Animated.View>
      </Pressable>
      {expanded && (
        <View style={thinkingStyles.content}>
          <Text style={thinkingStyles.text} selectable>
            {content}
          </Text>
        </View>
      )}
    </View>
  );
}

export function ChatBubble({ message, isStreaming = false, usedFallback = false }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  // Parse thinking blocks for AI messages
  const { thinking, response } = useMemo(() => {
    if (isUser) return { thinking: null, response: message.content };
    return parseThinkingBlocks(message.content);
  }, [message.content, isUser]);

  const handleLongPress = async () => {
    await Clipboard.setStringAsync(message.content);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Markdown styles for AI messages
  const markdownStyles = useMemo(() => ({
    body: {
      color: colors.text,
      fontSize: fontSize.md,
      lineHeight: fontSize.md * 1.5,
    },
    // Headings
    heading1: {
      color: colors.text,
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    heading2: {
      color: colors.text,
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    heading3: {
      color: colors.text,
      fontSize: fontSize.md,
      fontWeight: fontWeight.bold,
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
    },
    // Paragraphs
    paragraph: {
      color: colors.text,
      fontSize: fontSize.md,
      lineHeight: fontSize.md * 1.6,
      marginTop: 0,
      marginBottom: spacing.sm,
    },
    // Code blocks
    code_inline: {
      backgroundColor: colors.surfaceHighlight,
      color: colors.primary,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: fontSize.sm,
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      borderRadius: borderRadius.xs,
    },
    code_block: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginVertical: spacing.sm,
    },
    fence: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginVertical: spacing.sm,
    },
    // Lists
    bullet_list: {
      marginVertical: spacing.xs,
    },
    ordered_list: {
      marginVertical: spacing.xs,
    },
    list_item: {
      flexDirection: 'row' as const,
      marginVertical: spacing.xxs,
    },
    bullet_list_icon: {
      color: colors.primary,
      fontSize: fontSize.sm,
      marginRight: spacing.sm,
    },
    ordered_list_icon: {
      color: colors.primary,
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      marginRight: spacing.sm,
    },
    // Links
    link: {
      color: colors.accent,
      textDecorationLine: 'underline' as const,
    },
    // Emphasis
    strong: {
      fontWeight: fontWeight.bold,
      color: colors.text,
    },
    em: {
      fontStyle: 'italic' as const,
      color: colors.text,
    },
    s: {
      textDecorationLine: 'line-through' as const,
      color: colors.textSecondary,
    },
    // Blockquotes
    blockquote: {
      backgroundColor: colors.surfaceElevated,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      paddingLeft: spacing.md,
      paddingVertical: spacing.sm,
      marginVertical: spacing.sm,
      borderRadius: borderRadius.sm,
    },
    // Horizontal rule
    hr: {
      backgroundColor: colors.border,
      height: 1,
      marginVertical: spacing.md,
    },
    // Tables
    table: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.sm,
      marginVertical: spacing.sm,
    },
    thead: {
      backgroundColor: colors.surfaceElevated,
    },
    th: {
      padding: spacing.sm,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    tr: {
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    td: {
      padding: spacing.sm,
    },
    // Text inside code blocks
    text: {
      color: colors.text,
    },
  }), []);

  // Rules for rendering (customize markdown behavior)
  const markdownRules = useMemo(() => ({
    // Custom code block rendering for syntax highlighting appearance
    fence: (node: any, children: any, parent: any, styles: any) => {
      const language = node.sourceInfo || '';
      return (
        <View key={node.key} style={styles.fence}>
          {language ? (
            <Text style={codeBlockStyles.language}>{language}</Text>
          ) : null}
          <Text style={codeBlockStyles.code} selectable>
            {node.content}
          </Text>
        </View>
      );
    },
    code_block: (node: any, children: any, parent: any, styles: any) => {
      return (
        <View key={node.key} style={styles.code_block}>
          <Text style={codeBlockStyles.code} selectable>
            {node.content}
          </Text>
        </View>
      );
    },
  }), []);

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
        <View style={styles.labelRow}>
          <Text style={[styles.label, isUser ? styles.userLabel : styles.aiLabel]}>
            {isUser ? 'You' : 'PocketAI'}
          </Text>
          {!isUser && isStreaming && (
            <View style={streamingStyles.streamingBadge}>
              <PulsingDot />
              <Text style={streamingStyles.streamingText}>Live</Text>
            </View>
          )}
          {!isUser && usedFallback && !isStreaming && (
            <View style={streamingStyles.fallbackBadge}>
              <Text style={streamingStyles.fallbackText}>non-streaming</Text>
            </View>
          )}
        </View>

        {/* Bubble */}
        <Pressable
          onLongPress={handleLongPress}
          style={({ pressed }) => [
            styles.bubble,
            isUser ? styles.userBubble : styles.aiBubble,
            pressed && styles.bubblePressed,
          ]}
        >
          {isUser ? (
            // User messages - plain text
            <Text
              style={[styles.text, styles.userText]}
              selectable={true}
            >
              {message.content}
            </Text>
          ) : (
            // AI messages - with optional thinking block
            <View>
              {/* Collapsible thinking block */}
              {thinking && (
                <ThinkingBlock
                  content={thinking}
                  isStreaming={isStreaming && !response}
                />
              )}

              {/* Main response with markdown */}
              {response ? (
                <Markdown
                  style={markdownStyles}
                  rules={markdownRules}
                >
                  {response}
                </Markdown>
              ) : isStreaming && !thinking ? (
                <Text style={streamingStyles.waitingText}>Thinking...</Text>
              ) : null}
              {isStreaming && response && <StreamingCursor />}
            </View>
          )}
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

// Additional styles for code blocks
const codeBlockStyles = StyleSheet.create({
  language: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
    textTransform: 'uppercase' as const,
  },
  code: {
    color: colors.primaryLight,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.6,
  },
});

// Streaming indicator styles
const streamingStyles = StyleSheet.create({
  cursorContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
    height: fontSize.md,
  },
  cursorBar: {
    width: 3,
    height: fontSize.md,
    backgroundColor: colors.primary,
    borderRadius: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  cursor: {
    color: colors.primary,
    fontSize: fontSize.md,
    marginLeft: 2,
  },
  waitingText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontStyle: 'italic',
  },
  streamingBadge: {
    backgroundColor: colors.primary + '30',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streamingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  streamingText: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fallbackBadge: {
    backgroundColor: colors.warning + '20',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    marginLeft: spacing.xs,
  },
  fallbackText: {
    color: colors.warning,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.medium,
  },
});

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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    marginHorizontal: spacing.xs,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
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

// Thinking block styles (Qwen3 thought process)
const thinkingStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.accent + '15',
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerText: {
    color: colors.accent,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.accent + '30',
  },
  text: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
    fontStyle: 'italic',
  },
});
