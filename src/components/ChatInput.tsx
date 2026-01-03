import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  Animated,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  shadows,
} from '../constants/theme';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

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
  const micPulse = useRef(new Animated.Value(1)).current;

  const {
    isListening,
    transcript,
    error,
    isAvailable,
    startListening,
    stopListening,
  } = useSpeechRecognition();

  // Update text when transcript changes
  useEffect(() => {
    if (transcript) {
      setText(transcript);
    }
  }, [transcript]);

  // Pulse animation while listening
  useEffect(() => {
    if (isListening) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(micPulse, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(micPulse, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => {
        animation.stop();
        micPulse.setValue(1);
      };
    }
  }, [isListening]);

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

  const handleMicPress = async () => {
    if (isListening) {
      await stopListening();
    } else {
      await startListening();
    }
  };

  const canSend = text.trim().length > 0 && !isLoading && !disabled;
  const showMic = !text.trim() && isAvailable && !isLoading;

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.container,
          isFocused && styles.containerFocused,
          disabled && styles.containerDisabled,
          isListening && styles.containerListening,
        ]}
      >
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={isListening ? 'Listening...' : placeholder}
          placeholderTextColor={isListening ? colors.primary : colors.textMuted}
          multiline
          maxLength={4000}
          editable={!isLoading && !disabled && !isListening}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
          returnKeyType="send"
        />

        {/* Mic button - shown when no text */}
        {showMic && (
          <Animated.View style={{ transform: [{ scale: micPulse }] }}>
            <TouchableOpacity
              style={[
                styles.micButton,
                isListening && styles.micButtonActive,
              ]}
              onPress={handleMicPress}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isListening ? 'mic' : 'mic-outline'}
                size={22}
                color={isListening ? colors.textInverse : colors.primary}
              />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Send button */}
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

      {/* Error message */}
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
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
  containerListening: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
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
  micButton: {
    width: 40,
    height: 40,
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary + '50',
  },
  micButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.glow,
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
  errorText: {
    color: colors.error,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
    marginLeft: spacing.md,
  },
});
