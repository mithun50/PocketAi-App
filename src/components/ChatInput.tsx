import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  Animated,
} from 'react-native';
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  shadows,
} from '../constants/theme';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  isLoading = false,
  disabled = false,
  placeholder = 'Message PocketAI...',
}: ChatInputProps) {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleSend = () => {
    if (text.trim() && !isLoading && !disabled) {
      // Animate button press
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.85,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      onSend(text.trim());
      setText('');
      Keyboard.dismiss();
    }
  };

  const canSend = text.trim().length > 0 && !isLoading && !disabled;

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.container,
          isFocused && styles.containerFocused,
          disabled && styles.containerDisabled,
        ]}
      >
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={4000}
          editable={!isLoading && !disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
          returnKeyType="send"
        />

        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={[
              styles.sendButton,
              canSend && styles.sendButtonActive,
            ]}
            onPress={handleSend}
            disabled={!canSend}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <SendIcon active={canSend} />
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

function SendIcon({ active }: { active: boolean }) {
  return (
    <View style={styles.sendIconContainer}>
      <View
        style={[
          styles.sendArrow,
          active && styles.sendArrowActive,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
    ...shadows.md,
  },
  containerFocused: {
    borderColor: colors.primary,
    ...shadows.glow,
  },
  containerDisabled: {
    opacity: 0.5,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    maxHeight: 120,
    minHeight: 40,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 40,
    height: 40,
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: colors.primary,
    ...shadows.glow,
  },
  sendIconContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.textMuted,
    transform: [{ rotate: '90deg' }, { translateX: 1 }],
  },
  sendArrowActive: {
    borderBottomColor: colors.textInverse,
  },
});
