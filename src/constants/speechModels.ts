export interface SpeechModelConfig {
  id: string;
  name: string;
  filename: string;
  sizeMB: number;
  minBytes: number;
  primaryUrl: string;
  mirrorUrl: string;
  description: string;
}

export const SPEECH_MODEL: SpeechModelConfig = {
  id: 'whisper-tiny-en',
  name: 'Whisper Tiny (English)',
  filename: 'ggml-tiny.en.bin',
  sizeMB: 75,
  minBytes: 75_000_000,
  primaryUrl: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin',
  mirrorUrl: 'https://hf-mirror.com/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin',
  description: 'On-device Whisper tiny English speech recognition model (74 MB). Runs fast and fully offline.',
};
