import { initWhisper, WhisperContext } from 'whisper.rn';
import {
  getSpeechModelPath,
  isSpeechModelDownloaded,
  downloadSpeechModel,
} from './speechModelManager';

let activeWhisperContext: WhisperContext | null = null;
let currentModelPath: string | null = null;

/**
 * Initializes or returns the cached Whisper context for on-device transcription.
 */
export async function getOrInitSpeechEngine(
  onModelDownloadProgress?: (percent: number, writtenMB: number, totalMB: number) => void
): Promise<WhisperContext> {
  const modelPath = getSpeechModelPath();

  // If context is already ready for this model, reuse it
  if (activeWhisperContext && currentModelPath === modelPath) {
    return activeWhisperContext;
  }

  // Ensure speech model weights exist on device
  const isDownloaded = await isSpeechModelDownloaded();
  if (!isDownloaded) {
    console.log('[SpeechRecognition] Speech model not found locally, downloading...');
    await downloadSpeechModel(onModelDownloadProgress);
  }

  // Clean up any stale context
  if (activeWhisperContext) {
    try {
      await activeWhisperContext.release();
    } catch (_) {}
    activeWhisperContext = null;
  }

  console.log('[SpeechRecognition] Initializing Whisper context with model:', modelPath);
  activeWhisperContext = await initWhisper({
    filePath: modelPath,
    useGpu: false, // Stable CPU execution on Android
  });
  currentModelPath = modelPath;

  return activeWhisperContext;
}

/**
 * Clean up Whisper native memory.
 */
export async function releaseSpeechEngine(): Promise<void> {
  if (activeWhisperContext) {
    try {
      console.log('[SpeechRecognition] Releasing Whisper context');
      await activeWhisperContext.release();
    } catch (err) {
      console.warn('[SpeechRecognition] Error releasing Whisper context:', err);
    } finally {
      activeWhisperContext = null;
      currentModelPath = null;
    }
  }
}

/**
 * Sanitize raw Whisper transcript output to remove artifact tokens and empty results.
 */
function sanitizeTranscript(rawText: string): string {
  let cleaned = rawText
    .replace(/\[(?:BLANK_AUDIO|MUSIC|SILENCE|APPLAUSE)\]/gi, '')
    .replace(/\((?:music|applause|laughter|silence)\)/gi, '')
    .trim();

  // Remove leading/trailing quotes or punctuation artifacts if alone
  if (cleaned === '.' || cleaned === '...' || cleaned === '!') {
    cleaned = '';
  }

  return cleaned;
}

/**
 * Transcribes audio from a WAV file URI or raw PCM ArrayBuffer using on-device Whisper.
 */
export async function transcribeAudio(
  audioSource: string | ArrayBuffer,
  onProgress?: (progress: number) => void,
  onModelDownloadProgress?: (percent: number, writtenMB: number, totalMB: number) => void
): Promise<string> {
  const context = await getOrInitSpeechEngine(onModelDownloadProgress);

  try {
    let resultText = '';

    if (typeof audioSource === 'string') {
      // Local WAV file path
      const { promise } = context.transcribe(audioSource, {
        language: 'en',
        maxThreads: 4,
        onProgress: onProgress ? (p) => onProgress(p) : undefined,
      });
      const res = await promise;
      resultText = res?.result || '';
    } else {
      // Raw 16-bit PCM ArrayBuffer
      const { promise } = context.transcribeData(audioSource, {
        language: 'en',
        maxThreads: 4,
        onProgress: onProgress ? (p) => onProgress(p) : undefined,
      });
      const res = await promise;
      resultText = res?.result || '';
    }

    const cleaned = sanitizeTranscript(resultText);
    console.log('[SpeechRecognition] Transcription complete:', {
      raw: resultText,
      cleaned,
    });
    return cleaned;
  } catch (error: any) {
    console.error('[SpeechRecognition] Transcription failed:', error);
    throw error;
  }
}
