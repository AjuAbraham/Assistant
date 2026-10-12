import * as FileSystem from 'expo-file-system/legacy';
import { DEFAULT_TTS_SETTINGS, KOKORO_VOICES_BY_ID, TtsSettings } from '../../constants/tts';

function getSettingsFilePath(): string {
  const docDir = FileSystem.documentDirectory || '';
  return `${docDir}tts_settings.json`;
}

/**
 * Load TTS settings from persistent storage.
 * Safely validates voice ID and speed, falling back to defaults if missing/corrupt.
 */
export async function loadTtsSettings(): Promise<TtsSettings> {
  try {
    const path = getSettingsFilePath();
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) {
      return { ...DEFAULT_TTS_SETTINGS };
    }

    const content = await FileSystem.readAsStringAsync(path);
    const parsed = JSON.parse(content);

    // Validate voiceId
    let voiceId = DEFAULT_TTS_SETTINGS.voiceId;
    if (parsed.voiceId && KOKORO_VOICES_BY_ID.has(parsed.voiceId)) {
      voiceId = parsed.voiceId;
    }

    // Validate speed (between 0.5 and 2.0)
    let speed = DEFAULT_TTS_SETTINGS.speed;
    if (typeof parsed.speed === 'number' && parsed.speed >= 0.5 && parsed.speed <= 2.0) {
      speed = parsed.speed;
    }

    // Validate autoPlay boolean
    const autoPlay = typeof parsed.autoPlay === 'boolean' ? parsed.autoPlay : DEFAULT_TTS_SETTINGS.autoPlay;

    return {
      voiceId,
      speed,
      autoPlay,
    };
  } catch (err) {
    console.warn('[ttsSettingsManager] Failed to load TTS settings, using defaults:', err);
    return { ...DEFAULT_TTS_SETTINGS };
  }
}

/**
 * Save TTS settings to persistent storage.
 */
export async function saveTtsSettings(settings: TtsSettings): Promise<void> {
  try {
    const path = getSettingsFilePath();
    const payload = JSON.stringify(settings);
    await FileSystem.writeAsStringAsync(path, payload);
  } catch (err) {
    console.warn('[ttsSettingsManager] Failed to save TTS settings:', err);
  }
}
