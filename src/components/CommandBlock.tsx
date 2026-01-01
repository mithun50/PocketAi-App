import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { colors, spacing, borderRadius, fontSize } from '../constants/theme';

interface CommandBlockProps {
  command: string;
  title?: string;
}

export function CommandBlock({ command, title }: CommandBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.codeContainer}>
        <Text style={styles.code}>{command}</Text>
        <TouchableOpacity
          style={[styles.copyButton, copied && styles.copyButtonCopied]}
          onPress={handleCopy}
        >
          <Text style={styles.copyText}>{copied ? 'Copied!' : 'Copy'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  title: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  codeContainer: {
    backgroundColor: '#0d0d1a',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  code: {
    fontFamily: 'monospace',
    color: colors.primary,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  copyButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  copyButtonCopied: {
    backgroundColor: colors.primaryDark,
  },
  copyText: {
    color: colors.text,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
});
