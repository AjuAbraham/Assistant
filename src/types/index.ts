export type LLMConfig = {
  id: string;
  name: string;
  tag: string;
  filename: string;
  sizeEst: string;
  sizeMB: number;
  description: string;
  primaryUrl: string;
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
  };
};

export type NavigationTab = 'assistant' | 'models' | 'settings';
