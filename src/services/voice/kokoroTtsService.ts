import { NativeModules, Platform } from 'react-native';
import { getTtsModelDir, isTtsModelDownloaded } from './ttsModelManager';
import { DEFAULT_TTS_SETTINGS, KOKORO_VOICES_BY_ID } from '../../constants/tts';

const { KokoroTtsModule } = NativeModules;

export interface SynthesisResult {
  wavPath: string;
  durationMs: number;
  sampleRate: number;
}

export interface SpeechPlaybackResult {
  started?: boolean;
  completed?: boolean;
  durationMs: number;
  sampleRate?: number;
}

/**
 * Clean LLM response text before speech synthesis.
 * Strips out <think>...</think> reasoning blocks, code snippets, markdown headers/bolding, and extra whitespace.
 */
export function cleanTextForSpeech(raw: string): string {
  if (!raw) return '';

  let text = raw;

  // 1. Remove complete or open <think> blocks
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  text = text.replace(/<think>[\s\S]*/gi, '');

  // 2. Remove markdown code fences ```...```
  text = text.replace(/```[\s\S]*?```/g, ' [code snippet omitted] ');

  // 3. Remove inline code `...`
  text = text.replace(/`([^`]+)`/g, '$1');

  // 4. Remove markdown headers #, ##, etc.
  text = text.replace(/^#+\s+/gm, '');

  // 5. Remove markdown bold/italics **text** or *text*
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/\*([^*]+)\*/g, '$1');

  // 6. Clean markdown links [text](url) -> text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // 7. Remove bullets and list numbering at line starts
  text = text.replace(/^[-*+]\s+/gm, '');
  text = text.replace(/^\d+\.\s+/gm, '');

  // 8. Collapse whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

class KokoroTtsService {
  private isLoaded = false;
  private activeSessionId: number = 0;

  private playbackTimer: any = null;
  private currentEndCallback: (() => void) | null = null;

  isAvailable(): boolean {
    return Platform.OS === 'android' && Boolean(KokoroTtsModule);
  }

  async isInitialized(): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      return await KokoroTtsModule.isInitialized();
    } catch (_) {
      return false;
    }
  }

  async isReady(): Promise<boolean> {
    return await this.isInitialized();
  }

  async initialize(customDir?: string): Promise<boolean> {
    if (!this.isAvailable()) {
      throw new Error('Kokoro TTS native module is only available on Android native builds.');
    }

    const isDownloaded = await isTtsModelDownloaded();
    if (!isDownloaded) {
      throw new Error('Kokoro model files are not downloaded yet. Please download in Voice Studio.');
    }

    const rawDir = customDir || getTtsModelDir();
    const modelDir = (rawDir.startsWith('file://') ? rawDir.substring(7) : rawDir).replace(/\/+$/, '');
    console.log('[kokoroTtsService] Initializing native engine with path:', modelDir);
    const result = await KokoroTtsModule.initialize(modelDir);
    this.isLoaded = Boolean(result?.success);
    console.log('[kokoroTtsService] Native engine initialized successfully:', result);
    return this.isLoaded;
  }

  /**
   * Synthesize text to a WAV audio file on disk.
   */
  async synthesize(
    text: string,
    voiceIdOrSpeakerId: string | number = DEFAULT_TTS_SETTINGS.voiceId,
    speed: number = DEFAULT_TTS_SETTINGS.speed
  ): Promise<SynthesisResult> {
    if (!this.isAvailable()) {
      throw new Error('Kokoro TTS is not available.');
    }

    const ready = await this.isInitialized();
    if (!ready) {
      await this.initialize();
    }

    let speakerId: number;
    if (typeof voiceIdOrSpeakerId === 'number') {
      speakerId = voiceIdOrSpeakerId;
    } else {
      const voiceMeta =
        KOKORO_VOICES_BY_ID.get(voiceIdOrSpeakerId) ||
        KOKORO_VOICES_BY_ID.get(DEFAULT_TTS_SETTINGS.voiceId);
      speakerId = voiceMeta?.speakerId ?? 10;
    }

    const clean = cleanTextForSpeech(text);
    return await KokoroTtsModule.synthesize(clean, speakerId, speed);
  }

  /**
   * Synthesizes and immediately plays speech on the device via AudioTrack.
   * Cancels any previously active playback session.
   */
  async speak(
    text: string,
    voiceIdOrSpeakerId: string | number = DEFAULT_TTS_SETTINGS.voiceId,
    speed: number = DEFAULT_TTS_SETTINGS.speed,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<SpeechPlaybackResult> {
    if (!this.isAvailable()) {
      throw new Error('Kokoro TTS is not available on this device.');
    }

    const currentSession = ++this.activeSessionId;

    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }
    const prevEnd = this.currentEndCallback;
    this.currentEndCallback = null;
    if (prevEnd) prevEnd();

    const ready = await this.isInitialized();
    if (!ready) {
      await this.initialize();
    }

    // If another playback started while initializing, abort this obsolete one
    if (currentSession !== this.activeSessionId) {
      return { durationMs: 0 };
    }

    let speakerId: number;
    if (typeof voiceIdOrSpeakerId === 'number') {
      speakerId = voiceIdOrSpeakerId;
    } else {
      const voiceMeta =
        KOKORO_VOICES_BY_ID.get(voiceIdOrSpeakerId) ||
        KOKORO_VOICES_BY_ID.get(DEFAULT_TTS_SETTINGS.voiceId);
      speakerId = voiceMeta?.speakerId ?? 10;
    }

    const clean = cleanTextForSpeech(text);
    if (!clean) {
      onEnd?.();
      return { durationMs: 0 };
    }

    onStart?.();
    console.log('[kokoroTtsService] Calling KokoroTtsModule.speak:', {
      preview: clean.slice(0, 60),
      speakerId,
      speed,
    });
    const result: SpeechPlaybackResult = await KokoroTtsModule.speak(clean, speakerId, speed);
    console.log('[kokoroTtsService] KokoroTtsModule.speak returned:', result);

    if (currentSession === this.activeSessionId) {
      const durationMs = result?.durationMs || 500;
      this.currentEndCallback = onEnd || null;
      this.playbackTimer = setTimeout(() => {
        if (currentSession === this.activeSessionId) {
          const endCb = this.currentEndCallback;
          this.currentEndCallback = null;
          this.playbackTimer = null;
          if (endCb) endCb();
        }
      }, Math.max(200, Math.round(durationMs) + 150));
    }

    return result;
  }

  /**
   * Immediately stops any currently playing speech.
   */
  async stop(): Promise<void> {
    this.activeSessionId++;
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }
    const endCb = this.currentEndCallback;
    this.currentEndCallback = null;
    if (endCb) endCb();

    if (!this.isAvailable()) return;
    try {
      await KokoroTtsModule.stop();
    } catch (_) {}
  }

  /**
   * Returns whether speech is actively playing.
   */
  async isPlaying(): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      return await KokoroTtsModule.isPlaying();
    } catch (_) {
      return false;
    }
  }

  /**
   * Releases native resources.
   */
  async release(): Promise<void> {
    this.isLoaded = false;
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }
    this.currentEndCallback = null;
    if (!this.isAvailable()) return;
    try {
      await KokoroTtsModule.release();
    } catch (_) {}
  }
}

export const kokoroTts = new KokoroTtsService();
export const kokoroTtsService = kokoroTts;
