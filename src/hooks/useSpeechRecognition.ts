import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';

interface SpeechRecognitionState {
  isListening: boolean;
  transcript: string;
  error: string | null;
  isAvailable: boolean;
}

/**
 * Speech recognition hook using expo-av for recording
 * Works in Expo Go - records audio for manual processing
 * For live transcription, build native APK with expo-speech-recognition
 */
export function useSpeechRecognition() {
  const [state, setState] = useState<SpeechRecognitionState>({
    isListening: false,
    transcript: '',
    error: null,
    isAvailable: true, // expo-av works in Expo Go
  });

  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingUri = useRef<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  const startListening = useCallback(async () => {
    try {
      // Request permissions
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        setState(prev => ({ ...prev, error: 'Microphone permission denied' }));
        return false;
      }

      // Configure audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Clear state
      setState(prev => ({ ...prev, transcript: '', error: null, isListening: true }));

      // Start recording
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;

      console.log('[STT] Recording started');
      return true;
    } catch (e: any) {
      console.log('[STT] Start error:', e);
      setState(prev => ({
        ...prev,
        isListening: false,
        error: e.message || 'Failed to start recording',
      }));
      return false;
    }
  }, []);

  const stopListening = useCallback(async () => {
    if (!recordingRef.current) return;

    try {
      console.log('[STT] Stopping recording...');
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      recordingUri.current = uri;

      setState(prev => ({ ...prev, isListening: false }));

      if (uri) {
        console.log('[STT] Recording saved:', uri);
        // For Expo Go: show message that recording is ready
        // In native build, this would use expo-speech-recognition
        setState(prev => ({
          ...prev,
          transcript: '[Voice recorded - build APK for live transcription]',
          error: null,
        }));
      }
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
    if (!recordingRef.current) return;

    try {
      await recordingRef.current.stopAndUnloadAsync();
      recordingRef.current = null;
      setState(prev => ({ ...prev, transcript: '', isListening: false, error: null }));
    } catch (e) {
      console.log('[STT] Cancel error:', e);
    }
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    cancelListening,
    recordingUri: recordingUri.current,
  };
}
