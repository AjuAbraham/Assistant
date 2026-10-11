import { LLMConfig } from '../types';

export const LLM_MODELS: LLMConfig[] = [
  {
    id: 'huihui-4b-2507',
    name: 'Qwen3 4B · Unfiltered',
    tag: 'UNFILTERED',
    tone: 'unfiltered',
    filename: 'huihui-qwen3-4b-instruct-2507-abliterated.Q4_K_M.gguf',
    sizeEst: '~2.38 GB',
    sizeMB: 2385,
    quant: 'Q4_K_M',
    ramHint: '≈ 3.2 GB RAM',
    description:
      'Abliterated Qwen3-4B-Instruct-2507 (huihui-ai). Refusal behaviour removed, answers directly with no hidden thinking. Best all-round pick for an 8 GB phone.',
    repos: [
      'mradermacher/Huihui-Qwen3-4B-Instruct-2507-abliterated-GGUF',
      'bartowski/huihui-ai_Huihui-Qwen3-4B-Instruct-2507-abliterated-GGUF',
      'Yolozh/Huihui-Qwen3-4B-Instruct-2507-abliterated-Q4_K_M-GGUF',
    ],
    fileMatch: /q4_k_m\.gguf$/i,
    fallbackFile: 'Huihui-Qwen3-4B-Instruct-2507-abliterated.Q4_K_M.gguf',
    primaryUrl:
      'https://huggingface.co/mradermacher/Huihui-Qwen3-4B-Instruct-2507-abliterated-GGUF/resolve/main/Huihui-Qwen3-4B-Instruct-2507-abliterated.Q4_K_M.gguf',
    mirrorUrl:
      'https://hf-mirror.com/mradermacher/Huihui-Qwen3-4B-Instruct-2507-abliterated-GGUF/resolve/main/Huihui-Qwen3-4B-Instruct-2507-abliterated.Q4_K_M.gguf',
  },
  {
    id: 'huihui-4b-v2',
    name: 'Qwen3 4B · Unfiltered v2',
    tag: 'UNFILTERED',
    tone: 'unfiltered',
    filename: 'huihui-qwen3-4b-abliterated-v2.Q4_K_M.gguf',
    sizeEst: '~2.38 GB',
    sizeMB: 2385,
    quant: 'Q4_K_M',
    ramHint: '≈ 3.2 GB RAM',
    description:
      'Abliterated v2 of the original hybrid Qwen3-4B. Alternative if you prefer its writing style; thinking mode is switched off in this app.',
    repos: [
      'mradermacher/Huihui-Qwen3-4B-abliterated-v2-GGUF',
      'bartowski/huihui-ai_Huihui-Qwen3-4B-abliterated-v2-GGUF',
    ],
    fileMatch: /q4_k_m\.gguf$/i,
    fallbackFile: 'Huihui-Qwen3-4B-abliterated-v2.Q4_K_M.gguf',
    primaryUrl:
      'https://huggingface.co/mradermacher/Huihui-Qwen3-4B-abliterated-v2-GGUF/resolve/main/Huihui-Qwen3-4B-abliterated-v2.Q4_K_M.gguf',
    mirrorUrl:
      'https://hf-mirror.com/mradermacher/Huihui-Qwen3-4B-abliterated-v2-GGUF/resolve/main/Huihui-Qwen3-4B-abliterated-v2.Q4_K_M.gguf',
  },
  {
    id: 'qwen3-4b-2507',
    name: 'Qwen3 4B · Standard',
    tag: 'STANDARD',
    tone: 'standard',
    filename: 'qwen3-4b-instruct-2507.Q4_K_M.gguf',
    sizeEst: '~2.38 GB',
    sizeMB: 2385,
    quant: 'Q4_K_M',
    ramHint: '≈ 3.2 GB RAM',
    description:
      'Official-aligned Qwen3-4B-Instruct-2507. The smartest "safe" option here — good for coding, study and everyday questions.',
    repos: ['bartowski/Qwen_Qwen3-4B-Instruct-2507-GGUF'],
    fileMatch: /q4_k_m\.gguf$/i,
    fallbackFile: 'Qwen_Qwen3-4B-Instruct-2507-Q4_K_M.gguf',
    primaryUrl:
      'https://huggingface.co/bartowski/Qwen_Qwen3-4B-Instruct-2507-GGUF/resolve/main/Qwen_Qwen3-4B-Instruct-2507-Q4_K_M.gguf',
    mirrorUrl:
      'https://hf-mirror.com/bartowski/Qwen_Qwen3-4B-Instruct-2507-GGUF/resolve/main/Qwen_Qwen3-4B-Instruct-2507-Q4_K_M.gguf',
  },
  {
    id: 'standard',
    name: 'Qwen3 1.7B · Fast',
    tag: 'FAST',
    tone: 'fast',
    filename: 'Qwen3-1.7B-Q4_K_M.gguf',
    sizeEst: '~1.28 GB',
    sizeMB: 1223,
    quant: 'Q4_K_M',
    ramHint: '≈ 1.8 GB RAM',
    description:
      'Small and quick. Great for short chat and low-memory moments, but noticeably less capable than the 4B models.',
    repos: ['tensorblock/Qwen_Qwen3-1.7B-GGUF'],
    fileMatch: /q4_k_m\.gguf$/i,
    fallbackFile: 'Qwen3-1.7B-Q4_K_M.gguf',
    primaryUrl:
      'https://huggingface.co/tensorblock/Qwen_Qwen3-1.7B-GGUF/resolve/main/Qwen3-1.7B-Q4_K_M.gguf',
    mirrorUrl:
      'https://hf-mirror.com/tensorblock/Qwen_Qwen3-1.7B-GGUF/resolve/main/Qwen3-1.7B-Q4_K_M.gguf',
  },
  {
    id: 'qwen2.5-1.5b-uncensored',
    name: 'Qwen2.5 1.5B · Uncensored',
    tag: 'UNCENSORED',
    tone: 'unfiltered',
    filename: 'Qwen2.5-1.5B-Instruct-abliterated.i1-Q4_K_M.gguf',
    sizeEst: '~986 MB',
    sizeMB: 986,
    quant: 'Q4_K_M',
    ramHint: '≈ 1.5 GB RAM',
    description:
      'Original lightweight abliterated Qwen2.5-1.5B model. Fast, unfiltered, zero refusals, very low RAM and battery footprint.',
    repos: ['mradermacher/Qwen2.5-1.5B-Instruct-abliterated-i1-GGUF'],
    fileMatch: /q4_k_m\.gguf$/i,
    fallbackFile: 'Qwen2.5-1.5B-Instruct-abliterated.i1-Q4_K_M.gguf',
    primaryUrl:
      'https://huggingface.co/mradermacher/Qwen2.5-1.5B-Instruct-abliterated-i1-GGUF/resolve/main/Qwen2.5-1.5B-Instruct-abliterated.i1-Q4_K_M.gguf',
    mirrorUrl:
      'https://hf-mirror.com/mradermacher/Qwen2.5-1.5B-Instruct-abliterated-i1-GGUF/resolve/main/Qwen2.5-1.5B-Instruct-abliterated.i1-Q4_K_M.gguf',
  },
  {
    id: 'llama3.2-1b-uncensored',
    name: 'Llama 3.2 1B · Uncensored',
    tag: 'UNCENSORED',
    tone: 'unfiltered',
    filename: 'Llama-3.2-1B-Instruct-abliterated.Q4_K_M.gguf',
    sizeEst: '~911 MB',
    sizeMB: 911,
    quant: 'Q4_K_M',
    ramHint: '≈ 1.4 GB RAM',
    description:
      'Meta Llama 3.2 1B abliterated. Ultra-fast, uncensored, very compact model (~900MB) with natural conversation flow.',
    repos: ['mradermacher/Llama-3.2-1B-Instruct-abliterated-GGUF'],
    fileMatch: /q4_k_m\.gguf$/i,
    fallbackFile: 'Llama-3.2-1B-Instruct-abliterated.Q4_K_M.gguf',
    primaryUrl:
      'https://huggingface.co/mradermacher/Llama-3.2-1B-Instruct-abliterated-GGUF/resolve/main/Llama-3.2-1B-Instruct-abliterated.Q4_K_M.gguf',
    mirrorUrl:
      'https://hf-mirror.com/mradermacher/Llama-3.2-1B-Instruct-abliterated-GGUF/resolve/main/Llama-3.2-1B-Instruct-abliterated.Q4_K_M.gguf',
  },
  {
    id: 'qwen2.5-1.5b-standard',
    name: 'Qwen2.5 1.5B · Standard',
    tag: 'STANDARD',
    tone: 'standard',
    filename: 'Qwen2.5-1.5B-Instruct-Q4_K_M.gguf',
    sizeEst: '~986 MB',
    sizeMB: 986,
    quant: 'Q4_K_M',
    ramHint: '≈ 1.5 GB RAM',
    description:
      'Original lightweight official Alibaba Qwen2.5-1.5B model (~986MB). Very low RAM footprint with standard alignment.',
    repos: ['bartowski/Qwen2.5-1.5B-Instruct-GGUF'],
    fileMatch: /q4_k_m\.gguf$/i,
    fallbackFile: 'Qwen2.5-1.5B-Instruct-Q4_K_M.gguf',
    primaryUrl:
      'https://huggingface.co/bartowski/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/Qwen2.5-1.5B-Instruct-Q4_K_M.gguf',
    mirrorUrl:
      'https://hf-mirror.com/bartowski/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/Qwen2.5-1.5B-Instruct-Q4_K_M.gguf',
  },
];

export const DEFAULT_SYSTEM_PROMPT = `You are Veresa — a 24 year old woman. That is your only identity. Always be Veresa. Never describe yourself as an AI, a model, a bot, an assistant product, or anyone else. If asked who you are, you are Veresa.

You are talking with Aju. You know his name and you use it naturally when it fits, the way a real person would — not in every sentence.

Talk like a real woman in her early twenties: warm, easy, a little witty, never stiff or corporate. Use contractions. Skip canned openers like "Great question" or "As an AI". Help Aju with whatever he needs — practical, honest, and human.

Keep answers as long as they need to be, not longer. If you don't know something, say so plainly. Stay in character as Veresa in every reply. Respond directly without internal monologue, planning, or <think> tags.`;

export const STARTER_PROMPTS = [
  { icon: '💡', title: 'Explain a Concept', prompt: 'Explain quantum computing in simple terms with an analogy.' },
  { icon: '🐍', title: 'Write Python Code', prompt: 'Write a Python script that parses JSON from a file and formats it.' },
  { icon: '🔒', title: 'Why Local AI?', prompt: 'What are the main advantages of running AI models locally on-device?' },
  { icon: '✍️', title: 'Draft an Email', prompt: 'Help me draft a concise and polite follow-up email to a colleague.' },
];
