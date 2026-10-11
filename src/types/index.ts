export type LLMConfig = {
  id: string;
  name: string;
  tag: string;
  tone?: string;
  filename: string;
  sizeEst?: string;
  sizeMB: number;
  quant?: string;
  ramHint?: string;
  description: string;
  repos?: string[];
  fileMatch?: RegExp;
  fallbackFile?: string;
  primaryUrl?: string;
  mirrorUrl?: string;
};

export type ModelStatus =
  | 'not_downloaded'
  | 'downloading'
  | 'downloaded'
  | 'loading'
  | 'ready'
  | 'error';

export type ModelState = {
  status: ModelStatus;
  progress: number;
  writtenMB: number;
  totalMB: number;
  error?: string;
};

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  metrics?: {
    ttftMs: number;
    tokensPerSec: number;
    totalTokens: number;
    durationSec: number;
    firstVisibleMs?: number;
    promptTokens?: number;
    promptMs?: number;
    thinkingTokens?: number;
    hadThinking?: boolean;
  };
};

export type NavigationTab = 'assistant' | 'models' | 'settings';

export type ParsedSegment =
  | { type: 'text'; content: string }
  | { type: 'code'; language: string; code: string };
