/**
 * Kokoro TTS Constants & Configuration
 */

export interface TtsSettings {
  voiceId: string;
  speed: number;
  autoPlay: boolean;
}

export const DEFAULT_TTS_SETTINGS: TtsSettings = {
  voiceId: 'af_sky',
  speed: 1.0,
  autoPlay: false,
};

export const FIXED_PREVIEW_TEXT = "Hello, I'm Veresa. How can I help you today?";

export interface KokoroVoiceMetadata {
  id: string;
  name: string;
  speakerId: number;
  gender: 'Female' | 'Male';
  accent: 'American' | 'British';
  traits: string;
  qualityGrade: string;
}

/**
 * Verified Kokoro-82M voices mapped to their speaker IDs in the multi-lang model.
 * af_sky is the preferred and default voice.
 */
export const KOKORO_VOICES: KokoroVoiceMetadata[] = [
  {
    id: 'af_sky',
    name: 'Sky',
    speakerId: 10,
    gender: 'Female',
    accent: 'American',
    traits: 'Friendly, upbeat, modern dynamic rhythm',
    qualityGrade: 'B (Dynamic)',
  },
  {
    id: 'af_nicole',
    name: 'Nicole',
    speakerId: 6,
    gender: 'Female',
    accent: 'American',
    traits: 'Conversational, warm, whisper-soft natural cadence',
    qualityGrade: 'B (High naturalness)',
  },
  {
    id: 'af_heart',
    name: 'Heart',
    speakerId: 0,
    gender: 'Female',
    accent: 'American',
    traits: 'Clear, studio-grade narrative delivery',
    qualityGrade: 'A (Top tier)',
  },
  {
    id: 'af_bella',
    name: 'Bella',
    speakerId: 3,
    gender: 'Female',
    accent: 'American',
    traits: 'Bright, lively, expressive personality',
    qualityGrade: 'A- (High tier)',
  },
  {
    id: 'af_sarah',
    name: 'Sarah',
    speakerId: 9,
    gender: 'Female',
    accent: 'American',
    traits: 'Calm, gentle, smooth assistant tone',
    qualityGrade: 'B (Smooth)',
  },
  {
    id: 'am_adam',
    name: 'Adam',
    speakerId: 11,
    gender: 'Male',
    accent: 'American',
    traits: 'Deep, steady, authoritative narrator',
    qualityGrade: 'B (Deep tone)',
  },
  {
    id: 'am_michael',
    name: 'Michael',
    speakerId: 16,
    gender: 'Male',
    accent: 'American',
    traits: 'Articulate, professional, grounded delivery',
    qualityGrade: 'B (Professional)',
  },
  {
    id: 'bf_emma',
    name: 'Emma',
    speakerId: 21,
    gender: 'Female',
    accent: 'British',
    traits: 'Classic British RP, articulate and refined',
    qualityGrade: 'B (Refined British)',
  },
  {
    id: 'bf_isabella',
    name: 'Isabella',
    speakerId: 22,
    gender: 'Female',
    accent: 'British',
    traits: 'Gentle British cadence, warm and courteous',
    qualityGrade: 'B (Gentle British)',
  },
  {
    id: 'bm_george',
    name: 'George',
    speakerId: 26,
    gender: 'Male',
    accent: 'British',
    traits: 'Stately British baritone, measured pacing',
    qualityGrade: 'B (Stately British)',
  },
  {
    id: 'bm_lewis',
    name: 'Lewis',
    speakerId: 27,
    gender: 'Male',
    accent: 'British',
    traits: 'Contemporary British male, crisp and engaging',
    qualityGrade: 'B (Crisp British)',
  },
];

export const KOKORO_VOICES_BY_ID = new Map<string, KokoroVoiceMetadata>(
  KOKORO_VOICES.map((v) => [v.id, v])
);

export const TTS_SPEED_OPTIONS = [
  { val: 0.75, label: '0.75x' },
  { val: 1.0, label: '1.00x (Default)' },
  { val: 1.25, label: '1.25x' },
  { val: 1.5, label: '1.50x' },
];

export const TTS_MODEL_FILES = {
  model: {
    filename: 'model.onnx',
    url: 'https://huggingface.co/csukuangfj/kokoro-multi-lang-v1_0/resolve/main/model.onnx',
    sizeMB: 310,
    minBytes: 300 * 1024 * 1024,
  },
  voices: {
    filename: 'voices.bin',
    url: 'https://huggingface.co/csukuangfj/kokoro-multi-lang-v1_0/resolve/main/voices.bin',
    sizeMB: 27,
    minBytes: 25 * 1024 * 1024,
  },
  tokens: {
    filename: 'tokens.txt',
    url: 'https://huggingface.co/csukuangfj/kokoro-multi-lang-v1_0/resolve/main/tokens.txt',
    sizeMB: 0.001,
    minBytes: 500,
  },
  lexicon: {
    filename: 'lexicon-us-en.txt',
    url: 'https://huggingface.co/csukuangfj/kokoro-multi-lang-v1_0/resolve/main/lexicon-us-en.txt',
    sizeMB: 5.7,
    minBytes: 5 * 1024 * 1024,
  },
  espeakFiles: [
    { name: 'phondata', url: 'https://huggingface.co/csukuangfj/kokoro-multi-lang-v1_0/resolve/main/espeak-ng-data/phondata', minBytes: 500000 },
    { name: 'phondata-manifest', url: 'https://huggingface.co/csukuangfj/kokoro-multi-lang-v1_0/resolve/main/espeak-ng-data/phondata-manifest', minBytes: 15000 },
    { name: 'phonindex', url: 'https://huggingface.co/csukuangfj/kokoro-multi-lang-v1_0/resolve/main/espeak-ng-data/phonindex', minBytes: 30000 },
    { name: 'phontab', url: 'https://huggingface.co/csukuangfj/kokoro-multi-lang-v1_0/resolve/main/espeak-ng-data/phontab', minBytes: 50000 },
    { name: 'intonations', url: 'https://huggingface.co/csukuangfj/kokoro-multi-lang-v1_0/resolve/main/espeak-ng-data/intonations', minBytes: 1500 },
    { name: 'en_dict', url: 'https://huggingface.co/csukuangfj/kokoro-multi-lang-v1_0/resolve/main/espeak-ng-data/en_dict', minBytes: 150000 },
    { name: 'lang/gmw/en', url: 'https://huggingface.co/csukuangfj/kokoro-multi-lang-v1_0/resolve/main/espeak-ng-data/lang/gmw/en', minBytes: 100 },
    { name: 'lang/gmw/en-US', url: 'https://huggingface.co/csukuangfj/kokoro-multi-lang-v1_0/resolve/main/espeak-ng-data/lang/gmw/en-US', minBytes: 200 },
    { name: 'lang/gmw/en-GB-x-rp', url: 'https://huggingface.co/csukuangfj/kokoro-multi-lang-v1_0/resolve/main/espeak-ng-data/lang/gmw/en-GB-x-rp', minBytes: 200 },
  ],
  totalSizeMB: 343,
};

export const TTS_MODEL_ASSETS = TTS_MODEL_FILES;
