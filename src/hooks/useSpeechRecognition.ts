import { useState, useEffect, useCallback, useRef } from 'react';

// Try to import expo-speech-recognition, but handle if not available
let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEvent: any = null;
let isNativeModuleAvailable = false;

try {
  const speechModule = require('expo-speech-recognition');
  ExpoSpeechRecognitionModule = speechModule.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent = speechModule.useSpeechRecognitionEvent;
  isNativeModuleAvailable = !!ExpoSpeechRecognitionModule;
} catch (e) {
  console.log('[STT] expo-speech-recognition not available (Expo Go?)');
  isNativeModuleAvailable = false;
}

interface SpeechRecognitionState {
  isListening: boolean;
  transcript: string;
  error: string | null;
  isAvailable: boolean;
}

/**
 * Speech recognition hook using expo-speech-recognition
 * Falls back gracefully when native module not available (Expo Go)
 */
export function useSpeechRecognition() {
  const [state, setState] = useState<SpeechRecognitionState>({
    isListening: false,
    transcript: '',
    error: null,
    isAvailable: false,
  });

  const transcriptRef = useRef('');

  // Check availability on mount
  useEffect(() => {
    const checkAvailability = async () => {
      if (!isNativeModuleAvailable) {
        console.log('[STT] Native module not available');
        setState(prev => ({ ...prev, isAvailable: false }));
        return;
      }

      try {
        const status = await ExpoSpeechRecognitionModule.getStateAsync();
        setState(prev => ({
          ...prev,
          isAvailable: status !== 'inactive',
        }));
      } catch (e) {
        console.log('[STT] Availability check failed:', e);
        setState(prev => ({ ...prev, isAvailable: false }));
      }
    };
    checkAvailability();
  }, []);

  // Set up event listeners only if native module is available
  useEffect(() => {
    if (!isNativeModuleAvailable || !useSpeechRecognitionEvent) {
      return;
    }

    // Note: useSpeechRecognitionEvent is a hook and can't be called conditionally
    // So we handle this differently - the events just won't fire if module isn't loaded
  }, []);

  const startListening = useCallback(async () => {
    if (!isNativeModuleAvailable) {
      setState(prev => ({
        ...prev,
        error: 'Speech recognition requires a native build. Run: npx expo prebuild',
      }));
      return false;
    }

    try {
      // Request permissions
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();

      if (!result.granted) {
        setState(prev => ({
          ...prev,
          error: 'Microphone permission denied. Please enable in Settings.',
        }));
        return false;
      }

      // Clear previous transcript
      transcriptRef.current = '';
      setState(prev => ({ ...prev, transcript: '', error: null, isListening: true }));

      // Start recognition
      await ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        maxAlternatives: 1,
        continuous: false,
        requiresOnDeviceRecognition: false,
        addsPunctuation: true,
      });

      console.log('[STT] Started listening');
      return true;
    } catch (e: any) {
      console.log('[STT] Start error:', e);
      setState(prev => ({
        ...prev,
        isListening: false,
        error: e.message || 'Failed to start speech recognition',
      }));
      return false;
    }
  }, []);

  const stopListening = useCallback(async () => {
    if (!isNativeModuleAvailable) return;

    try {
      console.log('[STT] Stopping...');
      await ExpoSpeechRecognitionModule.stop();
      setState(prev => ({ ...prev, isListening: false }));
    } catch (e: any) {
      console.log('[STT] Stop error:', e);
      setState(prev => ({
        ...prev,
        isListening: false,
        error: e.message || 'Failed to stop recording',
      }));
    }
  }, []);

  const cancelListening = useCallback(async () => {
    if (!isNativeModuleAvailable) return;

    try {
      await ExpoSpeechRecognitionModule.abort();
      setState(prev => ({
        ...prev,
        transcript: '',
        isListening: false,
        error: null
      }));
    } catch (e) {
      console.log('[STT] Cancel error:', e);
    }
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    cancelListening,
  };
}

/**
 * Hook wrapper that uses native speech recognition events
 * Must be used in a component that renders when native module is available
 */
export function useSpeechRecognitionWithEvents(
  onResult?: (transcript: string, isFinal: boolean) => void,
  onError?: (error: string) => void
) {
  const baseHook = useSpeechRecognition();

  // Only set up event listeners if module is available
  useEffect(() => {
    if (!isNativeModuleAvailable) return;

    // These would be set up via the native module's event system
    // For now, we rely on the promise-based API
  }, []);

  return baseHook;
}
