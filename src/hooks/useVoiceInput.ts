import { useState, useRef, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { useAudioStream } from 'expo-audio';
import { VoiceInputState } from '../types';
import {
  configureAudioForRecording,
  requestMicrophonePermission,
  cleanupRecordingFile,
} from '../services/voice/audioRecorder';
import { savePcmAsWavFile } from '../services/voice/wavHelper';
import { transcribeAudio } from '../services/voice/speechRecognition';

export interface UseVoiceInputReturn {
  voiceState: VoiceInputState;
  isRecording: boolean;
  isTranscribing: boolean;
  transcriptionStatus: string | null;
  recordingDurationSec: number;
  recordedUri: string | null;
  errorMessage: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  cancelRecording: () => Promise<void>;
  resetVoiceState: () => void;
}

export function useVoiceInput(): UseVoiceInputReturn {
  const [voiceState, setVoiceState] = useState<VoiceInputState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [recordingDurationSec, setRecordingDurationSec] = useState<number>(0);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcriptionStatus, setTranscriptionStatus] = useState<string | null>(null);

  // Buffer to accumulate raw PCM16 audio chunks
  const audioChunksRef = useRef<ArrayBuffer[]>([]);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isBusyRef = useRef<boolean>(false);
  const isRecordingRef = useRef<boolean>(false);

  // Native PCM audio stream at 16kHz mono 16-bit
  const { stream } = useAudioStream({
    sampleRate: 16000,
    channels: 1,
    encoding: 'int16',
    onBuffer: (buffer) => {
      if (isRecordingRef.current && buffer.data && buffer.data.byteLength > 0) {
        audioChunksRef.current.push(buffer.data);
      }
    },
  });

  const clearTimer = useCallback(() => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
      try {
        stream?.stop();
      } catch (_) {}
    };
  }, [clearTimer, stream]);

  const startRecording = useCallback(async () => {
    if (isBusyRef.current || isRecordingRef.current || isTranscribing) {
      return;
    }

    try {
      isBusyRef.current = true;
      setErrorMessage(null);
      setRecordedUri(null);
      setRecordingDurationSec(0);
      setTranscriptionStatus(null);
      audioChunksRef.current = [];

      setVoiceState('requestingPermission');
      const granted = await requestMicrophonePermission();
      if (!granted) {
        setVoiceState('idle');
        Alert.alert(
          'Microphone Permission Required',
          'Veresa needs microphone access to listen to your voice. Please enable it in device settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      await configureAudioForRecording();

      // Start native PCM audio streaming
      await stream.start();
      isRecordingRef.current = true;
      setVoiceState('recording');

      // Start duration counter
      clearTimer();
      const startTime = Date.now();
      durationTimerRef.current = setInterval(() => {
        const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
        setRecordingDurationSec(elapsedSec);
      }, 500);
    } catch (error: any) {
      console.error('[useVoiceInput] Failed to start recording:', error);
      isRecordingRef.current = false;
      setErrorMessage(error?.message || 'Failed to start recording');
      setVoiceState('error');
    } finally {
      isBusyRef.current = false;
    }
  }, [isTranscribing, stream, clearTimer]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!isRecordingRef.current) {
      return null;
    }

    try {
      isBusyRef.current = true;
      isRecordingRef.current = false;
      clearTimer();

      // Stop stream capture
      try {
        stream.stop();
      } catch (err) {
        console.warn('[useVoiceInput] Error stopping stream:', err);
      }

      const chunks = audioChunksRef.current;
      const totalBytes = chunks.reduce((acc, c) => acc + c.byteLength, 0);

      // Require at least ~200ms of audio (16000 samples/sec * 2 bytes/sample * 0.2s = 6400 bytes)
      if (totalBytes < 3200) {
        console.log('[useVoiceInput] Audio recording was too short, discarding.');
        setVoiceState('idle');
        return null;
      }

      // Enter transcribing state
      setIsTranscribing(true);
      setVoiceState('transcribing');
      setTranscriptionStatus('Converting speech to text...');

      // Concatenate raw PCM16 chunks into a single byte array
      const pcmBytes = new Uint8Array(totalBytes);
      let offset = 0;
      for (const chunk of chunks) {
        pcmBytes.set(new Uint8Array(chunk), offset);
        offset += chunk.byteLength;
      }

      // Package into standard WAV file for Whisper STT
      const wavUri = await savePcmAsWavFile(pcmBytes, 16000, 1);
      setRecordedUri(wavUri);

      // Transcribe via on-device Whisper model
      const transcript = await transcribeAudio(
        wavUri,
        undefined, // transcription progress
        (pct) => {
          setTranscriptionStatus(`Downloading speech model (${pct}%)...`);
        }
      );

      // Clean up the temporary WAV file
      await cleanupRecordingFile(wavUri);

      setVoiceState('idle');
      setIsTranscribing(false);
      setTranscriptionStatus(null);

      return transcript;
    } catch (error: any) {
      console.error('[useVoiceInput] Failed to transcribe recording:', error);
      setErrorMessage(error?.message || 'Failed to transcribe audio');
      setVoiceState('error');
      setIsTranscribing(false);
      setTranscriptionStatus(null);
      return null;
    } finally {
      isBusyRef.current = false;
      isRecordingRef.current = false;
    }
  }, [stream, clearTimer]);

  const cancelRecording = useCallback(async () => {
    try {
      isBusyRef.current = true;
      isRecordingRef.current = false;
      clearTimer();

      try {
        stream.stop();
      } catch (_) {}

      audioChunksRef.current = [];
      if (recordedUri) {
        await cleanupRecordingFile(recordedUri);
        setRecordedUri(null);
      }

      setRecordingDurationSec(0);
      setErrorMessage(null);
      setIsTranscribing(false);
      setTranscriptionStatus(null);
      setVoiceState('idle');
    } catch (error: any) {
      console.warn('[useVoiceInput] Cancel error:', error);
      setVoiceState('idle');
    } finally {
      isBusyRef.current = false;
      isRecordingRef.current = false;
    }
  }, [stream, clearTimer, recordedUri]);

  const resetVoiceState = useCallback(() => {
    setVoiceState('idle');
    setErrorMessage(null);
    setIsTranscribing(false);
    setTranscriptionStatus(null);
  }, []);

  return {
    voiceState,
    isRecording: voiceState === 'recording',
    isTranscribing,
    transcriptionStatus,
    recordingDurationSec,
    recordedUri,
    errorMessage,
    startRecording,
    stopRecording,
    cancelRecording,
    resetVoiceState,
  };
}
