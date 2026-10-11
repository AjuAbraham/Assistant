import * as FileSystem from 'expo-file-system/legacy';
import {
  AudioModule,
  requestRecordingPermissionsAsync,
  getRecordingPermissionsAsync,
  setAudioModeAsync,
  RecordingPresets,
} from 'expo-audio';

/**
 * Configure system audio mode for microphone recording.
 */
export async function configureAudioForRecording(): Promise<void> {
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: true,
      interruptionMode: 'doNotMix',
    });
  } catch (error) {
    console.warn('[AudioRecorder] Failed to configure audio mode:', error);
  }
}

/**
 * Request microphone recording permission.
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const { granted } = await requestRecordingPermissionsAsync();
    return granted;
  } catch (error) {
    console.error('[AudioRecorder] Permission request failed:', error);
    return false;
  }
}

/**
 * Check if microphone recording permission is already granted.
 */
export async function checkMicrophonePermission(): Promise<boolean> {
  try {
    const { granted } = await getRecordingPermissionsAsync();
    return granted;
  } catch (error) {
    console.warn('[AudioRecorder] Permission check failed:', error);
    return false;
  }
}

/**
 * Safely delete a temporary recording file.
 */
export async function cleanupRecordingFile(uri: string | null): Promise<void> {
  if (!uri) return;
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  } catch (error) {
    console.warn('[AudioRecorder] Failed to clean up recording file:', uri, error);
  }
}

export { RecordingPresets };
