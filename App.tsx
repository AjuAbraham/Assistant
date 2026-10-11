import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Share,
  Clipboard,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { initLlama, LlamaContext } from 'llama.rn';

// ==========================================
// 1. DESIGN SYSTEM & TOKENS
// ==========================================
const THEME = {
  colors: {
    bgApp: '#080C14',
    bgSurface: '#0E1626',
    bgCard: '#131E33',
    bgCardElevated: '#182744',

    borderSubtle: '#1E2C44',
    borderStrong: '#2B3E60',
    borderFocus: '#38BDF8',

    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    textDisabled: '#475569',

    accent: '#38BDF8',
    accentGlow: 'rgba(56, 189, 248, 0.15)',

    userBubble: '#243B5A',
    userBubbleText: '#F8FAFC',

    assistantBubble: 'transparent',
    assistantBubbleText: '#E8EEF6',

    success: '#4ADE80',
    successGlow: 'rgba(74, 222, 128, 0.15)',

    danger: '#EF4444',
    dangerGlow: 'rgba(239, 68, 68, 0.15)',

    warning: '#F59E0B',
    warningGlow: 'rgba(245, 158, 11, 0.15)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
  radii: {
    xs: 4,
    sm: 6,
    md: 10,
    lg: 14,
    xl: 18,
    full: 9999,
  },
};

// ==========================================
// 2. MODEL CONFIGURATIONS & TYPES
// ==========================================
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

type ModelStatus =
  | 'not_downloaded'
  | 'downloading'
  | 'downloaded'
  | 'loading'
  | 'ready'
  | 'error';

type ModelState = {
  status: ModelStatus;
  progress: number;
  writtenMB: number;
  totalMB: number;
  error?: string;
};

type Message = {
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

type NavigationTab = 'assistant' | 'models' | 'settings';


const DEFAULT_SYSTEM_PROMPT = `You are Veresa — a 24 year old woman. That is your only identity. Always be Veresa. Never describe yourself as an AI, a model, a bot, an assistant product, or anyone else. If asked who you are, you are Veresa.

You are talking with Aju. You know his name and you use it naturally when it fits, the way a real person would — not in every sentence.

Talk like a real woman in her early twenties: warm, easy, a little witty, never stiff or corporate. Use contractions. Skip canned openers like "Great question" or "As an AI". Help Aju with whatever he needs — practical, honest, and human.

Keep answers as long as they need to be, not longer. If you don't know something, say so plainly. Stay in character as Veresa in every reply. Respond directly without internal monologue, planning, or <think> tags.`;

const STARTER_PROMPTS = [
  { icon: '💡', title: 'Explain a Concept', prompt: 'Explain quantum computing in simple terms with an analogy.' },
  { icon: '🐍', title: 'Write Python Code', prompt: 'Write a Python script that parses JSON from a file and formats it.' },
  { icon: '🔒', title: 'Why Local AI?', prompt: 'What are the main advantages of running AI models locally on-device?' },
  { icon: '✍️', title: 'Draft an Email', prompt: 'Help me draft a concise and polite follow-up email to a colleague.' },
];

// ==========================================
// 3. ABSTRACT BREATHING ORB COMPONENT
// ==========================================
const AnimatedOrb = ({ isReady }: { isReady: boolean }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  return (
    <View style={orbStyles.container}>
      <Animated.View
        style={[
          orbStyles.outerRing,
          isReady ? orbStyles.outerReady : orbStyles.outerIdle,
          { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <View style={[orbStyles.middleRing, isReady ? orbStyles.middleReady : orbStyles.middleIdle]}>
          <View style={[orbStyles.innerCore, isReady ? orbStyles.coreReady : orbStyles.coreIdle]} />
        </View>
      </Animated.View>
    </View>
  );
};

const orbStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: THEME.spacing.md,
  },
  outerRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  outerReady: {
    borderColor: 'rgba(56, 189, 248, 0.3)',
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
  },
  outerIdle: {
    borderColor: 'rgba(100, 116, 139, 0.2)',
    backgroundColor: 'rgba(100, 116, 139, 0.05)',
  },
  middleRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  middleReady: {
    borderColor: 'rgba(56, 189, 248, 0.6)',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  middleIdle: {
    borderColor: 'rgba(100, 116, 139, 0.4)',
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
  },
  innerCore: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  coreReady: {
    backgroundColor: THEME.colors.accent,
    elevation: 6,
  },
  coreIdle: {
    backgroundColor: THEME.colors.textSecondary,
  },
});

// ==========================================
// 4. CODE BLOCK & MESSAGE CONTENT RENDERER
// ==========================================
type ParsedSegment =
  | { type: 'text'; content: string }
  | { type: 'code'; language: string; code: string };

function parseMessageSegments(raw: string): ParsedSegment[] {
  if (!raw) return [];
  const segments: ParsedSegment[] = [];
  const codeBlockRegex = /```([a-zA-Z0-9_\-\+\.]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      const text = raw.substring(lastIndex, match.index);
      if (text.trim().length > 0) {
        segments.push({ type: 'text', content: text });
      }
    }
    const language = (match[1] || 'CODE').trim().toUpperCase();
    const code = match[2].trimEnd();
    segments.push({ type: 'code', language, code });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < raw.length) {
    const trailing = raw.substring(lastIndex);
    if (trailing.length > 0) {
      segments.push({ type: 'text', content: trailing });
    }
  }

  if (segments.length === 0) {
    segments.push({ type: 'text', content: raw });
  }

  return segments;
}

function stripThinking(raw: string): { visible: string; stillThinking: boolean } {
  if (!raw) return { visible: '', stillThinking: false };

  let text = raw.replace(/\r\n/g, '\n');

  // Strip all closed reasoning/thinking blocks
  text = text.replace(/<(think|thinking|thought|reasoning|thought_process)>[\s\S]*?<\/\1>/gi, '');

  // Check for any unclosed opening reasoning tags currently being streamed
  const openMatch = /<(think|thinking|thought|reasoning|thought_process)>/i.exec(text);
  if (openMatch && openMatch.index !== undefined) {
    return {
      visible: text.slice(0, openMatch.index).trimStart(),
      stillThinking: true,
    };
  }

  // Strip any stray or orphaned closing tags
  text = text.replace(/<\/(think|thinking|thought|reasoning|thought_process)>/gi, '');

  return { visible: text.trimStart(), stillThinking: false };
}

function buildFormattedChatPrompt(
  model: LLMConfig,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options?: { enableThinking?: boolean }
): { prompt: string; stop: string[] } {
  const isLlama = model.filename.toLowerCase().includes('llama') || model.id.includes('llama');
  const isQwen3 =
    model.filename.toLowerCase().includes('qwen3') ||
    model.id.includes('qwen3') ||
    model.name.includes('Qwen3');
  const enableThinking = options?.enableThinking ?? false;

  if (isLlama) {
    let p = '<|begin_of_text|>';
    for (const msg of messages) {
      p += `<|start_header_id|>${msg.role}<|end_header_id|>\n\n${msg.content}<|eot_id|>`;
    }
    p += '<|start_header_id|>assistant<|end_header_id|>\n\n';
    return { prompt: p, stop: ['<|eot_id|>', '<|end_of_text|>'] };
  }

  // Standard ChatML (Qwen 2.5 / Qwen 3)
  let p = '';
  for (const msg of messages) {
    p += `<|im_start|>${msg.role}\n${msg.content}<|im_end|>\n`;
  }
  p += '<|im_start|>assistant\n';
  // Official Qwen3 non-thinking prompt closure: prefill with closed thinking tags
  if (isQwen3 && !enableThinking) {
    p += '<think>\n\n</think>\n\n';
  }
  return { prompt: p, stop: ['<|im_end|>', '<|endoftext|>'] };
}

function TypingDots({ label }: { label?: string } = {}) {
  const a = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(a, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [a]);

  const opacityFor = (phase: number) =>
    a.interpolate({
      inputRange: [0, 0.33, 0.66, 1],
      outputRange:
        phase === 0
          ? [0.25, 1, 0.25, 0.25]
          : phase === 1
          ? [0.25, 0.25, 1, 0.25]
          : [0.25, 0.25, 0.25, 1],
    });

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        {[0, 1, 2].map((i) => (
          <Animated.View
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: THEME.colors.textSecondary,
              opacity: opacityFor(i),
            }}
          />
        ))}
      </View>
      {label ? (
        <Text style={{ fontSize: 13, color: THEME.colors.textSecondary, fontStyle: 'italic' }}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

// Micro Icons in pure React Native (zero native dependencies, instant rendering)
function CopyIcon({ size = 11, color = '#8B949E' }: { size?: number; color?: string }) {
  const outer = size;
  const inner = Math.round(size * 0.72);
  const offset = Math.round(size * 0.25);
  return (
    <View style={{ width: outer, height: outer }}>
      {/* Background overlapping page */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: inner,
          height: inner,
          borderRadius: 2,
          borderWidth: 1.1,
          borderColor: color,
          opacity: 0.45,
        }}
      />
      {/* Foreground primary page */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: inner,
          height: inner,
          borderRadius: 2,
          borderWidth: 1.1,
          borderColor: color,
          backgroundColor: '#0D1117',
        }}
      />
    </View>
  );
}

function CheckIcon({ size = 11, color = '#10B981' }: { size?: number; color?: string }) {
  return (
    <Text style={{ fontSize: size, color, fontWeight: '900', lineHeight: size + 2 }}>✓</Text>
  );
}

const codeStyles = StyleSheet.create({
  container: {
    marginVertical: 8,
    backgroundColor: '#0D1117',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#30363D',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#161B22',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  langTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  langDot: {
    color: '#10B981',
    fontSize: 8,
  },
  langText: {
    color: '#8B949E',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  copyBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  copyBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  copyBtnText: {
    color: '#8B949E',
    fontSize: 11,
    fontWeight: '500',
  },
  copyBtnTextActive: {
    color: '#10B981',
  },
  scroll: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    lineHeight: 18,
    color: '#E6EDF3',
  },
});

function CodeBlockCard({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = () => {
    Clipboard.setString(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={codeStyles.container}>
      <View style={codeStyles.header}>
        <View style={codeStyles.langTag}>
          <Text style={codeStyles.langDot}>●</Text>
          <Text style={codeStyles.langText}>{language || 'CODE'}</Text>
        </View>
        <TouchableOpacity
          style={[codeStyles.copyBtn, copied && codeStyles.copyBtnActive]}
          onPress={onCopy}
          activeOpacity={0.7}
          accessibilityLabel={copied ? 'Copied' : 'Copy code'}
        >
          {copied ? <CheckIcon size={12} color="#10B981" /> : <CopyIcon size={12} color="#8B949E" />}
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={true} style={codeStyles.scroll}>
        <Text style={codeStyles.codeText} selectable>
          {code}
        </Text>
      </ScrollView>
    </View>
  );
}

function MessageContentRenderer({ content, isUser }: { content: string; isUser: boolean }) {
  const segments = parseMessageSegments(content);

  return (
    <View style={{ width: '100%' }}>
      {segments.map((seg, idx) => {
        if (seg.type === 'code') {
          return <CodeBlockCard key={idx} language={seg.language} code={seg.code} />;
        }
        return (
          <Text
            key={idx}
            style={[styles.messageContentText, isUser ? styles.contentUser : styles.contentAssistant]}
            selectable
          >
            {seg.content}
          </Text>
        );
      })}
    </View>
  );
}

// ==========================================
// 5. MAIN APPLICATION COMPONENT
// ==========================================
export default function App() {
  // Navigation Tab
  const [activeTab, setActiveTab] = useState<NavigationTab>('assistant');

  // Models State
  const [selectedModel, setSelectedModel] = useState<LLMConfig>(LLM_MODELS[0]);
  const [modelStates, setModelStates] = useState<Record<string, ModelState>>(() => {
    const initial: Record<string, ModelState> = {};
    for (const m of LLM_MODELS) {
      initial[m.id] = { status: 'not_downloaded', progress: 0, writtenMB: 0, totalMB: m.sizeMB };
    }
    return initial;
  });

  // Llama Runtime Context
  const [llmContext, setLlmContext] = useState<LlamaContext | null>(null);
  const [activeModelId, setActiveModelId] = useState<string | null>(null);

  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [streamingText, setStreamingText] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expandedMetricsId, setExpandedMetricsId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Settings
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(1024);
  const [systemPrompt, setSystemPrompt] = useState<string>(DEFAULT_SYSTEM_PROMPT);

  // References
  const scrollViewRef = useRef<ScrollView>(null);
  const userScrolledUpRef = useRef<boolean>(false);
  const downloadJobsRef = useRef<Record<string, FileSystem.DownloadResumable>>({});
  const cancelledDownloadsRef = useRef<Record<string, boolean>>({});

  const getModelPath = (filename: string) => {
    return `${FileSystem.documentDirectory || ''}${filename}`;
  };

  useEffect(() => {
    checkAllModels();
  }, []);

  useEffect(() => {
    try {
      const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
      const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
      const showSub =
        Keyboard && typeof Keyboard.addListener === 'function'
          ? Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true))
          : null;
      const hideSub =
        Keyboard && typeof Keyboard.addListener === 'function'
          ? Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false))
          : null;
      return () => {
        try {
          showSub?.remove?.();
          hideSub?.remove?.();
        } catch (_) {}
      };
    } catch (e) {
      console.warn('Keyboard listener error', e);
    }
  }, []);

  // Validate on-device model weights
  const checkAllModels = async () => {
    if (!FileSystem.documentDirectory) return;

    for (const model of LLM_MODELS) {
      if (downloadJobsRef.current[model.id]) continue;

      const path = getModelPath(model.filename);
      try {
        const info = await FileSystem.getInfoAsync(path);
        const actualBytes = info.exists ? Number((info as any).size || 0) : 0;
        const minimumBytes = model.sizeMB * 1024 * 1024 * 0.85;

        if (info.exists && actualBytes >= minimumBytes) {
          const sizeMB = Math.round(actualBytes / (1024 * 1024));
          setModelStates((prev) => ({
            ...prev,
            [model.id]: {
              status: activeModelId === model.id ? 'ready' : 'downloaded',
              progress: 100,
              writtenMB: sizeMB,
              totalMB: sizeMB,
            },
          }));
        } else {
          setModelStates((prev) => ({
            ...prev,
            [model.id]: {
              status: 'not_downloaded',
              progress: 0,
              writtenMB: 0,
              totalMB: model.sizeMB,
            },
          }));
        }
      } catch (e) {
        console.log('Error checking file for', model.id, e);
      }
    }
  };

  // Download Model in background with staging .part verification
  const downloadModel = async (model: LLMConfig) => {
    const finalPath = getModelPath(model.filename);
    const stagingPath = `${finalPath}.part`;
    const minimumBytes = model.sizeMB * 1024 * 1024 * 0.85;

    try {
      setErrorMsg(null);
      cancelledDownloadsRef.current[model.id] = false;
      setModelStates((prev) => ({
        ...prev,
        [model.id]: {
          ...prev[model.id],
          status: 'downloading',
          progress: prev[model.id]?.progress || 0,
          writtenMB: prev[model.id]?.writtenMB || 0,
          totalMB: model.sizeMB,
          error: undefined,
        },
      }));

      // Gather candidate URLs prioritizing primaryUrl and hf-mirror
      const urls: string[] = [];
      if (model.primaryUrl) urls.push(model.primaryUrl);
      if (model.mirrorUrl) urls.push(model.mirrorUrl);
      if (model.repos && (model.fallbackFile || model.filename)) {
        const targetFilename = model.fallbackFile || model.filename;
        for (const repo of model.repos) {
          const hfUrl = `https://huggingface.co/${repo}/resolve/main/${targetFilename}`;
          const mirrorUrl = `https://hf-mirror.com/${repo}/resolve/main/${targetFilename}`;
          if (!urls.includes(hfUrl)) urls.push(hfUrl);
          if (!urls.includes(mirrorUrl)) urls.push(mirrorUrl);
        }
      }

      let downloadSuccess = false;
      let lastError: any = new Error('Download failed');

      for (const url of urls) {
        if (cancelledDownloadsRef.current[model.id]) {
          throw new Error('Download cancelled');
        }
        if (downloadSuccess) break;

        let job: FileSystem.DownloadResumable | null = null;
        const progressCallback = (p: FileSystem.DownloadProgressData) => {
          if (cancelledDownloadsRef.current[model.id]) return;
          const expected =
            p.totalBytesExpectedToWrite > 0
              ? p.totalBytesExpectedToWrite
              : model.sizeMB * 1024 * 1024;
          const pct = Math.min(
            100,
            Math.max(0, Math.round((p.totalBytesWritten / expected) * 100))
          );
          const writtenMB = Number((p.totalBytesWritten / (1024 * 1024)).toFixed(1));
          const totalMB = Number((expected / (1024 * 1024)).toFixed(1));

          setModelStates((prev) => ({
            ...prev,
            [model.id]: {
              ...prev[model.id],
              status: 'downloading',
              progress: Math.max(prev[model.id]?.progress || 0, pct),
              writtenMB: Math.max(prev[model.id]?.writtenMB || 0, writtenMB),
              totalMB,
            },
          }));
        };

        try {
          job = FileSystem.createDownloadResumable(
            url,
            stagingPath,
            {},
            progressCallback
          );
          downloadJobsRef.current[model.id] = job;

          let result: FileSystem.FileSystemDownloadResult | undefined;
          let retryCount = 0;
          const maxRetries = 5;

          while (retryCount < maxRetries && !downloadSuccess) {
            if (cancelledDownloadsRef.current[model.id]) {
              throw new Error('Download cancelled');
            }

            try {
              if (retryCount === 0) {
                result = await job.downloadAsync();
              } else {
                console.log(`[Veresa] Resuming download (attempt ${retryCount}/${maxRetries})...`);
                result = await job.resumeAsync();
              }

              if (result?.uri) {
                const stagedInfo = await FileSystem.getInfoAsync(stagingPath);
                const stagedBytes = stagedInfo.exists ? Number((stagedInfo as any).size || 0) : 0;
                if (stagedBytes >= minimumBytes) {
                  downloadSuccess = true;
                  break;
                }
              }
            } catch (err: any) {
              if (cancelledDownloadsRef.current[model.id]) throw err;
              lastError = err;
              retryCount++;
              if (retryCount < maxRetries) {
                // Short wait before resume to let connection stabilize
                await new Promise((res) => setTimeout(res, 2000));
              }
            }
          }

          if (downloadSuccess) {
            delete downloadJobsRef.current[model.id];
            // Promote staged file
            await FileSystem.deleteAsync(finalPath, { idempotent: true });
            await FileSystem.moveAsync({ from: stagingPath, to: finalPath });
            const finalInfo = await FileSystem.getInfoAsync(finalPath);
            const finalMB = Math.round(Number((finalInfo as any).size || 0) / (1024 * 1024));

            setModelStates((prev) => ({
              ...prev,
              [model.id]: {
                ...prev[model.id],
                status: 'downloaded',
                progress: 100,
                writtenMB: finalMB,
                totalMB: finalMB,
                error: undefined,
              },
            }));
            return;
          }
        } catch (e: any) {
          delete downloadJobsRef.current[model.id];
          lastError = e;
          if (cancelledDownloadsRef.current[model.id]) {
            throw new Error('Download cancelled');
          }
        }
      }

      if (!downloadSuccess) {
        throw lastError;
      }
    } catch (e: any) {
      delete downloadJobsRef.current[model.id];
      const cancelled =
        cancelledDownloadsRef.current[model.id] || e?.message === 'Download cancelled';
      if (cancelled) {
        await FileSystem.deleteAsync(stagingPath, { idempotent: true }).catch(() => undefined);
      }
      setModelStates((prev) => ({
        ...prev,
        [model.id]: {
          ...prev[model.id],
          status: cancelled ? 'not_downloaded' : 'error',
          progress: cancelled ? 0 : prev[model.id]?.progress || 0,
          writtenMB: cancelled ? 0 : prev[model.id]?.writtenMB || 0,
          totalMB: model.sizeMB,
          error: cancelled ? undefined : e?.message || 'Download error',
        },
      }));
      if (!cancelled) {
        setErrorMsg(`Download Interrupted (${model.name}): ${e?.message || 'Network hiccup. Tap to resume.'}`);
      }
    }
  };

  // Cancel Download
  const cancelDownload = async (model: LLMConfig) => {
    cancelledDownloadsRef.current[model.id] = true;
    const job = downloadJobsRef.current[model.id];
    if (job) {
      try {
        await job.cancelAsync();
      } catch (e) {
        console.log('Error cancelling download:', e);
      }
      delete downloadJobsRef.current[model.id];
    }

    const stagingPath = `${getModelPath(model.filename)}.part`;
    try {
      await FileSystem.deleteAsync(stagingPath, { idempotent: true });
    } catch (e) {}

    setModelStates((prev) => ({
      ...prev,
      [model.id]: {
        ...prev[model.id],
        status: 'not_downloaded',
        progress: 0,
        writtenMB: 0,
        totalMB: model.sizeMB,
        error: undefined,
      },
    }));
  };

  // Delete Model with safety Alert
  const deleteModel = async (model: LLMConfig) => {
    if (isGenerating) {
      setErrorMsg('Stop active generation before deleting model weights.');
      return;
    }

    Alert.alert(
      'Delete Model',
      `Delete ${model.name}? You can re-download it anytime.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (llmContext && activeModelId === model.id) {
                await llmContext.release();
                setLlmContext(null);
                setActiveModelId(null);
              }

              const path = getModelPath(model.filename);
              await FileSystem.deleteAsync(path, { idempotent: true });

              setModelStates((prev) => ({
                ...prev,
                [model.id]: {
                  status: 'not_downloaded',
                  progress: 0,
                  writtenMB: 0,
                  totalMB: model.sizeMB,
                },
              }));
            } catch (e: any) {
              setErrorMsg(`Delete Failed: ${e.message}`);
            }
          },
        },
      ]
    );
  };

  // Load Model into RAM
  const loadModelIntoRam = async (model: LLMConfig) => {
    if (isGenerating) {
      setErrorMsg('Stop generation before switching models.');
      return;
    }

    try {
      setErrorMsg(null);
      setModelStates((prev) => ({
        ...prev,
        [model.id]: { ...prev[model.id], status: 'loading' },
      }));

      if (llmContext) {
        try {
          await llmContext.release();
        } catch (e) {
          console.log('Context release error:', e);
        }
        setLlmContext(null);
        setActiveModelId(null);
      }

      const path = getModelPath(model.filename);
      const modelInfo = await FileSystem.getInfoAsync(path);
      if (
        !modelInfo.exists ||
        Number((modelInfo as any).size || 0) < model.sizeMB * 1024 * 1024 * 0.85
      ) {
        throw new Error('Model file is incomplete. Please download it again.');
      }

      const ctx = await initLlama({
        model: path,
        n_ctx: 2048,
        n_threads: 4,
        n_gpu_layers: 0,
      });

      setLlmContext(ctx);
      setActiveModelId(model.id);
      setSelectedModel(model);

      setModelStates((prev) => {
        const updated = { ...prev };
        for (const k of Object.keys(updated)) {
          if (k === model.id) {
            updated[k] = { ...updated[k], status: 'ready' };
          } else if (updated[k].status === 'ready') {
            updated[k] = { ...updated[k], status: 'downloaded' };
          }
        }
        return updated;
      });
    } catch (e: any) {
      setLlmContext(null);
      setActiveModelId(null);
      setModelStates((prev) => {
        const updated = { ...prev };
        for (const key of Object.keys(updated)) {
          if (updated[key].status === 'ready') {
            updated[key] = { ...updated[key], status: 'downloaded' };
          }
        }
        updated[model.id] = {
          ...updated[model.id],
          status: 'error',
          error: e?.message || 'Model loading error',
        };
        return updated;
      });
      setErrorMsg(`Model Load Failed: ${e?.message || 'Error loading GGUF'}`);
    }
  };

  // Unload Model from RAM
  const unloadModel = async (model: LLMConfig) => {
    if (llmContext) {
      try {
        await llmContext.release();
      } catch (e) {}
      setLlmContext(null);
      setActiveModelId(null);
      setModelStates((prev) => ({
        ...prev,
        [model.id]: { ...prev[model.id], status: 'downloaded' },
      }));
    }
  };

  // Stop Generation
  const stopGeneration = async () => {
    if (llmContext && isGenerating) {
      try {
        await llmContext.stopCompletion();
      } catch (e) {
        console.log('Error stopping completion:', e);
      }
      setIsGenerating(false);
    }
  };

  // User Scroll detection
  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 80;
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    userScrolledUpRef.current = !isAtBottom;
  };

  // Send message and stream inference
  const sendMessage = async (promptOverride?: string) => {
    const text = (promptOverride || inputText).trim();
    if (!text || !llmContext || isGenerating) return;

    Keyboard.dismiss();
    setInputText('');
    setErrorMsg(null);
    userScrolledUpRef.current = false;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsGenerating(true);
    setStreamingText('');

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    let accumulated = '';
    const startTime = Date.now();
    const promptAssembleStart = Date.now();
    let promptAssembleEnd = 0;
    let completionInvokeTime = 0;
    let firstTokenTime = 0;
    let firstVisibleTime = 0;
    let tokenCount = 0;
    let lastStreamUpdateAt = 0;

    try {
      // Build recent conversation turns without exceeding context budget
      const allConversationMessages = [...messages, userMessage];
      const turns: Message[][] = [];
      for (const message of allConversationMessages) {
        if (message.role === 'user') {
          turns.push([message]);
        } else if (turns.length > 0) {
          turns[turns.length - 1].push(message);
        }
      }

      const recentTurns: Message[][] = [];
      let historyChars = 0;
      let historyMessages = 0;
      const maxHistoryChars = 5200;
      const maxHistoryMessages = 6;

      for (let i = turns.length - 1; i >= 0; i--) {
        const turn = turns[i];
        const turnChars = turn.reduce((sum, msg) => sum + msg.content.length, 0);
        if (
          recentTurns.length > 0 &&
          (historyChars + turnChars > maxHistoryChars ||
            historyMessages + turn.length > maxHistoryMessages)
        ) {
          break;
        }
        recentTurns.unshift(turn);
        historyChars += turnChars;
        historyMessages += turn.length;
      }

      const history = recentTurns.flat();
      const promptMessages = [
        {
          role: 'system' as const,
          content: systemPrompt,
        },
        ...history
          .map((msg) => ({
            role: msg.role as 'user' | 'assistant',
            // Clean past assistant turns so previous thinking tags or drafts never contaminate future turns
            content: msg.role === 'assistant' ? stripThinking(msg.content).visible.trim() : msg.content.trim(),
          }))
          .filter((msg) => msg.content.length > 0),
      ];
      promptAssembleEnd = Date.now();
      completionInvokeTime = Date.now();

      // Build official verified prompt format (with closed thinking tags for Qwen3)
      const formatted = buildFormattedChatPrompt(selectedModel, promptMessages, {
        enableThinking: false,
      });

      const isQwen3 =
        selectedModel.filename.toLowerCase().includes('qwen3') ||
        selectedModel.id.includes('qwen3') ||
        selectedModel.name.includes('Qwen3');
      const expectedSuffix = '<|im_start|>assistant\n<think>\n\n</think>\n\n';
      const promptEndsWithClosedThinking = formatted.prompt.endsWith(expectedSuffix);

      console.log('=== [FORMATTED PROMPT TAIL DIAGNOSTIC] ===', {
        model: selectedModel.name,
        isQwen3,
        promptLengthChars: formatted.prompt.length,
        promptTail: JSON.stringify(formatted.prompt.slice(-80)),
        closedThinkingVerified: isQwen3 ? promptEndsWithClosedThinking : 'N/A (non-Qwen3)',
      });

      if (isQwen3 && !promptEndsWithClosedThinking) {
        console.warn(
          '[DIAGNOSTIC ASSERTION FAILED] Non-thinking Qwen3 prompt must end with <think>\\n\\n</think>\\n\\n but ended with: ' +
            JSON.stringify(formatted.prompt.slice(-40))
        );
      }

      const result = await llmContext.completion(
        {
          prompt: formatted.prompt,
          stop: formatted.stop,
          n_predict: maxTokens,
          temperature,
          top_p: 0.8,
          top_k: 20,
          min_p: 0,
          penalty_repeat: 1.05,
          penalty_last_n: 64,
          penalty_present: 0,
          penalty_freq: 0,
        },
        (data) => {
          const piece = data.content !== undefined && data.content !== '' ? data.content : data.token;
          if (!piece) return;
          const now = Date.now();
          if (tokenCount === 0) firstTokenTime = now;
          if (tokenCount < 8) {
            console.log(`[RAW TOKEN #${tokenCount}]`, JSON.stringify(piece));
          }
          tokenCount++;
          accumulated += data.token || piece;

          const stripped = stripThinking(accumulated);
          if (firstVisibleTime === 0 && stripped.visible.trim().length > 0) {
            firstVisibleTime = now;
          }

          if (now - lastStreamUpdateAt >= 50 || piece.includes('\n')) {
            lastStreamUpdateAt = now;
            setStreamingText(stripped.visible);
          }
        }
      );

      const strippedFinal = stripThinking(accumulated);
      // Strictly use the stripped visible text — never show internal thinking in the chat
      let finalReply = strippedFinal.visible.trim();
      if (!finalReply && accumulated.trim().length > 0) {
        finalReply = "I'm right here! Could you try asking that again?";
      }
      setStreamingText(finalReply);
      const endTime = Date.now();
      const durationSec = (endTime - startTime) / 1000;
      const ttftMs = firstTokenTime > 0 ? firstTokenTime - completionInvokeTime : 0;
      const firstVisibleMs = firstVisibleTime > 0 ? firstVisibleTime - completionInvokeTime : ttftMs;
      const tokensPerSec =
        result?.timings?.predicted_per_second ??
        (durationSec > 0 ? parseFloat((tokenCount / durationSec).toFixed(1)) : 0);

      const hadThinking = /<(think|thinking|thought|reasoning)>/i.test(accumulated);
      const thinkingMatch = /<(think|thinking|thought|reasoning)>([\s\S]*?)<\/\1>/i.exec(accumulated);
      const thinkingText = thinkingMatch ? thinkingMatch[2] : '';
      const thinkingTokensEst = thinkingText ? Math.round(thinkingText.length / 4) : 0;

      // Diagnostic Logging as per report.md Section 5
      console.log('=== [LLM BENCHMARK DIAGNOSTICS] ===', {
        prompt: text,
        model: selectedModel.name,
        timings: {
          promptAssembleMs: promptAssembleEnd - promptAssembleStart,
          ttftNativeMs: ttftMs,
          firstVisibleMs,
          totalDurationSec: parseFloat(durationSec.toFixed(2)),
          nativePromptMs: result?.timings?.prompt_ms,
          nativePromptTokens: result?.timings?.prompt_n,
          nativePredictedMs: result?.timings?.predicted_ms,
          nativePredictedTokens: result?.timings?.predicted_n ?? tokenCount,
          nativePredictedSpeed: result?.timings?.predicted_per_second ?? tokensPerSec,
        },
        reasoningAnalysis: {
          hadThinking,
          thinkingChars: thinkingText.length,
          thinkingTokensEst,
        },
      });

      if (finalReply.trim()) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: finalReply.trim(),
          metrics: {
            ttftMs,
            firstVisibleMs,
            tokensPerSec,
            totalTokens: result?.timings?.predicted_n ?? tokenCount,
            durationSec: parseFloat(durationSec.toFixed(2)),
            promptTokens: result?.timings?.prompt_n,
            promptMs: result?.timings?.prompt_ms ? Math.round(result.timings.prompt_ms) : undefined,
            thinkingTokens: thinkingTokensEst,
            hadThinking,
          },
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
      setStreamingText('');
    } catch (e: any) {
      const strippedStopped = stripThinking(accumulated);
      const stoppedVisible = strippedStopped.visible.trim();
      if (stoppedVisible) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `${stoppedVisible} [stopped]`,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
      setErrorMsg(`Generation Error: ${e.message}`);
    } finally {
      setIsGenerating(false);
      setStreamingText('');
    }
  };

  const clearChat = () => {
    setMessages([]);
    setStreamingText('');
  };

  const activeState = modelStates[selectedModel.id] || {
    status: 'not_downloaded',
    progress: 0,
    writtenMB: 0,
    totalMB: selectedModel.sizeMB,
  };

  const isModelReady = activeState.status === 'ready' && llmContext !== null;
  const canSend = isModelReady && inputText.trim().length > 0 && !isGenerating;
  const downloadingCount = Object.values(modelStates).filter((s) => s.status === 'downloading').length;

  const totalStorageMB = Object.values(modelStates).reduce((acc, st) => {
    return st.status === 'downloaded' || st.status === 'ready' ? acc + (st.writtenMB || 0) : acc;
  }, 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={THEME.colors.bgApp}
        translucent={Platform.OS === 'android'}
      />

      <View style={styles.container}>
        {/* ========================================== */}
        {/* UNIVERSAL COMPACT TOP HEADER */}
        {/* ========================================== */}
        <View style={styles.header}>
          <View style={styles.headerBrandRow}>
            <View style={styles.brandLeft}>
              <View style={[styles.statusRing, isModelReady ? styles.statusRingReady : styles.statusRingIdle]}>
                <View style={[styles.statusDot, isModelReady ? styles.statusDotReady : styles.statusDotIdle]} />
              </View>
              <View>
                <Text style={styles.brandTitle}>VERESA</Text>
                <Text style={styles.brandSubtitle}>
                  {isModelReady ? `Offline • ${selectedModel.name.split(' ')[0]} ${selectedModel.tag}` : 'Private Offline AI'}
                </Text>
              </View>
            </View>

            <View style={styles.headerRightActions}>
              {/* Quick Model Pill */}
              <TouchableOpacity
                style={[styles.modelPill, isModelReady ? styles.modelPillReady : styles.modelPillIdle]}
                onPress={() => setActiveTab('models')}
                activeOpacity={0.7}
              >
                <Text style={[styles.modelPillText, isModelReady ? styles.modelPillTextReady : styles.modelPillTextIdle]}>
                  {isModelReady ? '● RAM ACTIVE' : activeState.status === 'loading' ? '⏳ LOADING' : activeState.status === 'downloading' ? '📥 DOWNLOADING' : '⚙️ MODELS'}
                </Text>
              </TouchableOpacity>

              {/* Clear / New Chat button */}
              {activeTab === 'assistant' && messages.length > 0 && (
                <TouchableOpacity style={styles.newChatBtn} onPress={clearChat} activeOpacity={0.75}>
                  <Text style={styles.newChatBtnPlus}>+</Text>
                  <Text style={styles.newChatBtnText}>New</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* ========================================== */}
        {/* TAB 1: ASSISTANT CONVERSATION SCREEN */}
        {/* ========================================== */}
        {activeTab === 'assistant' && (
          <KeyboardAvoidingView
            style={styles.tabContentContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
          >
            {/* Banner Alert if no model loaded */}
            {!isModelReady && (
              <TouchableOpacity
                style={styles.bannerAlert}
                onPress={() => setActiveTab('models')}
                activeOpacity={0.8}
              >
                <View style={styles.bannerAlertLeft}>
                  <View style={styles.bannerAlertIconBadge}>
                    <Text style={styles.bannerAlertIcon}>
                      {activeState.status === 'downloaded' ? '⚡' : activeState.status === 'downloading' ? '📥' : '🧠'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bannerAlertTitle}>
                      {activeState.status === 'downloaded'
                        ? 'Model downloaded. Tap to load into RAM.'
                        : activeState.status === 'downloading'
                        ? 'Downloading model weights in background...'
                        : 'No model loaded in RAM'}
                    </Text>
                    <Text style={styles.bannerAlertSub}>
                      {activeState.status === 'downloaded'
                        ? 'Activate model for instant offline responses'
                        : 'Tap here to visit Model Library'}
                    </Text>
                  </View>
                </View>
                <View style={styles.bannerAlertArrowBadge}>
                  <Text style={styles.bannerAlertChevron}>›</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Error Message */}
            {errorMsg && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
              </View>
            )}

            {/* Scrollable Conversation Stream */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.chatScroll}
              contentContainerStyle={styles.chatScrollContent}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets={true}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              onContentSizeChange={() => {
                if (!userScrolledUpRef.current) {
                  scrollViewRef.current?.scrollToEnd({ animated: false });
                }
              }}
            >
              {/* First-time Welcome & Empty State */}
              {messages.length === 0 && !streamingText && (
                <View style={styles.welcomeContainer}>
                  <AnimatedOrb isReady={isModelReady} />

                  <Text style={styles.welcomeTitle}>Hey Aju, I'm Veresa</Text>
                  <Text style={styles.welcomeSubtitle}>
                    Right here on this phone — private, offline, and just for you.
                  </Text>

                  <View style={styles.privacyPill}>
                    <Text style={styles.privacyPillText}>🔒 On-Device Inference • Zero Data Leaves Phone</Text>
                  </View>

                  {/* Starter Suggestions */}
                  <Text style={styles.startersHeader}>Suggested Starters</Text>
                  <View style={styles.startersList}>
                    {STARTER_PROMPTS.map((item, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[styles.starterCard, !isModelReady && styles.starterCardDisabled]}
                        onPress={() => sendMessage(item.prompt)}
                        disabled={!isModelReady || isGenerating}
                        activeOpacity={0.7}
                      >
                        <View style={styles.starterIconBadge}>
                          <Text style={styles.starterIcon}>{item.icon}</Text>
                        </View>
                        <View style={styles.starterTextGroup}>
                          <Text style={styles.starterTitle}>{item.title}</Text>
                          <Text style={styles.starterPromptPreview} numberOfLines={2}>
                            "{item.prompt}"
                          </Text>
                        </View>
                        <View style={styles.starterArrowBadge}>
                          <Text style={styles.starterArrowText}>↗</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Chat Message Bubbles */}
              {messages.map((m) => {
                const isUser = m.role === 'user';
                const isExpanded = expandedMetricsId === m.id;
                return (
                  <View key={m.id} style={[styles.bubbleWrapper, isUser ? styles.bubbleWrapperUser : styles.bubbleWrapperAssistant]}>
                    <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
                      <MessageContentRenderer content={m.content} isUser={isUser} />
                    </View>

                    <View style={[styles.messageActions, isUser ? styles.messageActionsUser : styles.messageActionsAssistant]}>
                      <TouchableOpacity
                        style={styles.ghostIconBtn}
                        onPress={() => {
                          Clipboard.setString(m.content);
                          setCopiedMessageId(m.id);
                          setTimeout(() => setCopiedMessageId(null), 2000);
                        }}
                        activeOpacity={0.6}
                        accessibilityLabel="Copy message"
                      >
                        {copiedMessageId === m.id ? (
                          <CheckIcon size={13} color="#10B981" />
                        ) : (
                          <CopyIcon size={13} color={THEME.colors.textTertiary} />
                        )}
                      </TouchableOpacity>

                      {!isUser && (
                        <TouchableOpacity
                          style={styles.ghostIconBtn}
                          onPress={() => Share.share({ message: m.content })}
                          activeOpacity={0.6}
                          accessibilityLabel="Share message"
                        >
                          <Text style={styles.ghostIconGlyph}>↗</Text>
                        </TouchableOpacity>
                      )}

                      {!isUser && m.metrics && (
                        <TouchableOpacity
                          style={styles.ghostIconBtn}
                          onPress={() => setExpandedMetricsId(isExpanded ? null : m.id)}
                          activeOpacity={0.6}
                          accessibilityLabel="Toggle stats"
                        >
                          <Text style={styles.ghostIconGlyph}>{isExpanded ? '×' : 'i'}</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {!isUser && m.metrics && isExpanded && (
                      <View style={styles.metricsBox}>
                        <View style={styles.metricItem}>
                          <Text style={styles.metricLabel}>Speed</Text>
                          <Text style={styles.metricVal}>{m.metrics.tokensPerSec} t/s</Text>
                        </View>
                        <View style={styles.metricItem}>
                          <Text style={styles.metricLabel}>TTFT (Native)</Text>
                          <Text style={styles.metricVal}>{m.metrics.ttftMs}ms</Text>
                        </View>
                        {m.metrics.firstVisibleMs !== undefined && (
                          <View style={styles.metricItem}>
                            <Text style={styles.metricLabel}>TTFT (Visible)</Text>
                            <Text style={styles.metricVal}>{m.metrics.firstVisibleMs}ms</Text>
                          </View>
                        )}
                        <View style={styles.metricItem}>
                          <Text style={styles.metricLabel}>Tokens</Text>
                          <Text style={styles.metricVal}>{m.metrics.totalTokens}</Text>
                        </View>
                        {m.metrics.promptTokens !== undefined && (
                          <View style={styles.metricItem}>
                            <Text style={styles.metricLabel}>Prompt Tok</Text>
                            <Text style={styles.metricVal}>{m.metrics.promptTokens}</Text>
                          </View>
                        )}
                        {m.metrics.promptMs !== undefined && (
                          <View style={styles.metricItem}>
                            <Text style={styles.metricLabel}>Prompt Time</Text>
                            <Text style={styles.metricVal}>{m.metrics.promptMs}ms</Text>
                          </View>
                        )}
                        {m.metrics.hadThinking !== undefined && (
                          <View style={styles.metricItem}>
                            <Text style={styles.metricLabel}>Had &lt;think&gt;</Text>
                            <Text style={[styles.metricVal, { color: m.metrics.hadThinking ? '#F59E0B' : '#10B981' }]}>
                              {m.metrics.hadThinking ? `YES (~${m.metrics.thinkingTokens || 0}t)` : 'NO (0t)'}
                            </Text>
                          </View>
                        )}
                        <View style={styles.metricItem}>
                          <Text style={styles.metricLabel}>Time</Text>
                          <Text style={styles.metricVal}>{m.metrics.durationSec}s</Text>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}

              {isGenerating && (
                <View style={styles.streamingWrapper}>
                  <View style={styles.streamingBubble}>
                    {streamingText ? (
                      <MessageContentRenderer content={streamingText} isUser={false} />
                    ) : (
                      <TypingDots label="Thinking..." />
                    )}
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Anchored Bottom Composer */}
            <View style={[styles.composerContainer, isKeyboardVisible && styles.composerContainerKeyboard]}>
              <View style={styles.composerCard}>
                <TextInput
                  style={styles.composerInput}
                  placeholder={isModelReady ? 'Message Veresa' : 'Load a model to start chatting'}
                  placeholderTextColor={THEME.colors.textTertiary}
                  value={inputText}
                  onChangeText={setInputText}
                  editable={isModelReady}
                  onFocus={() => {
                    userScrolledUpRef.current = false;
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 120);
                  }}
                  multiline
                  maxLength={2000}
                  textAlignVertical="top"
                  scrollEnabled
                  blurOnSubmit={false}
                  underlineColorAndroid="transparent"
                />

                <View style={styles.composerButtonSlot}>
                  {isGenerating ? (
                    <TouchableOpacity
                      style={styles.composerStopBtn}
                      onPress={stopGeneration}
                      activeOpacity={0.8}
                    >
                      <View style={styles.stopIconSquare} />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.composerSendBtn,
                        canSend ? styles.composerSendBtnActive : styles.composerSendBtnDisabled,
                      ]}
                      onPress={() => sendMessage()}
                      disabled={!canSend}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.sendArrowText, canSend ? styles.sendArrowActive : styles.sendArrowDisabled]}>
                        ↑
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        )}

        {/* ========================================== */}
        {/* TAB 2: MODEL LIBRARY & DOWNLOAD MANAGER */}
        {/* ========================================== */}
        {activeTab === 'models' && (
          <View style={styles.tabContentContainer}>
            <ScrollView contentContainerStyle={styles.modelsScrollContent} showsVerticalScrollIndicator={false}>
              {/* Storage & Memory Overview Header */}
              <View style={styles.modelsOverviewCard}>
                <View style={styles.overviewCol}>
                  <Text style={styles.overviewLabel}>RAM ACTIVE</Text>
                  <Text style={[styles.overviewVal, isModelReady ? styles.valSuccess : styles.valMuted]}>
                    {isModelReady ? selectedModel.name.split(' ')[0] : 'None'}
                  </Text>
                </View>
                <View style={styles.overviewDivider} />
                <View style={styles.overviewCol}>
                  <Text style={styles.overviewLabel}>STORAGE USED</Text>
                  <Text style={styles.overviewVal}>
                    {totalStorageMB > 0 ? `${(totalStorageMB / 1024).toFixed(2)} GB` : '0 GB'}
                  </Text>
                </View>
                <View style={styles.overviewDivider} />
                <View style={styles.overviewCol}>
                  <Text style={styles.overviewLabel}>RUNTIME</Text>
                  <Text style={[styles.overviewVal, styles.valAccent]}>llama.cpp</Text>
                </View>
              </View>

              <Text style={styles.sectionHeaderTitle}>AVAILABLE ON-DEVICE MODELS</Text>

              {/* Model Cards */}
              {LLM_MODELS.map((model) => {
                const st = modelStates[model.id] || { status: 'not_downloaded', progress: 0, writtenMB: 0, totalMB: model.sizeMB };
                const isLoaded = st.status === 'ready' && activeModelId === model.id;

                return (
                  <View key={model.id} style={[styles.modelCard, isLoaded && styles.modelCardActive]}>
                    <View style={styles.modelCardHeader}>
                      <View style={styles.modelNameRow}>
                        <Text style={styles.modelNameText}>{model.name}</Text>
                        <View
                          style={[
                            styles.tagBadge,
                            model.tag === 'UNFILTERED'
                              ? styles.tagUnfiltered
                              : model.tag === 'FAST'
                              ? styles.tagFast
                              : styles.tagStandard,
                          ]}
                        >
                          <Text style={styles.tagBadgeText}>{model.tag}</Text>
                        </View>
                      </View>

                      <View style={[styles.modelStateBadge, isLoaded ? styles.badgeReady : st.status === 'downloaded' ? styles.badgeDownloaded : styles.badgeIdle]}>
                        <Text style={[styles.modelStateBadgeText, isLoaded ? styles.textReady : st.status === 'downloaded' ? styles.textDownloaded : styles.textIdle]}>
                          {isLoaded ? '● ACTIVE IN RAM' : st.status === 'loading' ? 'LOADING...' : st.status === 'downloaded' ? 'DOWNLOADED' : st.status === 'downloading' ? 'DOWNLOADING' : 'AVAILABLE'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.modelDescriptionText}>{model.description}</Text>

                    <View style={styles.modelSpecsRow}>
                      <Text style={styles.modelSpecsText}>📦 {model.sizeEst || `${(model.sizeMB / 1024).toFixed(2)} GB`}</Text>
                      {model.quant && (
                        <>
                          <Text style={styles.modelSpecsDot}>•</Text>
                          <Text style={styles.modelSpecsText}>{model.quant}</Text>
                        </>
                      )}
                      {model.ramHint && (
                        <>
                          <Text style={styles.modelSpecsDot}>•</Text>
                          <Text style={styles.modelSpecsText}>{model.ramHint}</Text>
                        </>
                      )}
                    </View>

                    {/* Download Progress Bar */}
                    {st.status === 'downloading' && (
                      <View style={styles.downloadProgressBox}>
                        <View style={styles.downloadProgressHeader}>
                          <View style={styles.downloadingTitleRow}>
                            <ActivityIndicator size="small" color={THEME.colors.accent} />
                            <Text style={styles.downloadingTitleText}>Downloading weights...</Text>
                          </View>
                          <TouchableOpacity onPress={() => cancelDownload(model)} style={styles.downloadCancelBtn} activeOpacity={0.7}>
                            <Text style={styles.downloadCancelBtnText}>Cancel</Text>
                          </TouchableOpacity>
                        </View>

                        <View style={styles.progressTrack}>
                          <View style={[styles.progressFill, { width: `${Math.max(3, st.progress)}%` }]} />
                        </View>

                        <View style={styles.progressNumbersRow}>
                          <Text style={styles.progressMbText}>
                            {st.writtenMB > 0 ? `${st.writtenMB} MB` : '0 MB'} / {st.totalMB || model.sizeMB} MB
                          </Text>
                          <Text style={styles.progressPctText}>{st.progress}%</Text>
                        </View>
                      </View>
                    )}

                    {/* Loading State */}
                    {st.status === 'loading' && (
                      <View style={styles.modelLoadingBox}>
                        <ActivityIndicator size="small" color={THEME.colors.success} />
                        <Text style={styles.modelLoadingText}>Loading model weights into RAM (~2-3s)...</Text>
                      </View>
                    )}

                    {/* Actions */}
                    <View style={styles.modelActionsRow}>
                      {st.status === 'not_downloaded' && (
                        <TouchableOpacity style={styles.btnPrimary} onPress={() => downloadModel(model)} activeOpacity={0.8}>
                          <Text style={styles.btnPrimaryText}>📥 Download Model ({model.sizeEst})</Text>
                        </TouchableOpacity>
                      )}

                      {st.status === 'downloaded' && (
                        <View style={styles.buttonSplitRow}>
                          <TouchableOpacity style={styles.btnSuccess} onPress={() => loadModelIntoRam(model)} activeOpacity={0.8}>
                            <Text style={styles.btnSuccessText}>⚡ Load Into RAM</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.btnDanger} onPress={() => deleteModel(model)} activeOpacity={0.8}>
                            <Text style={styles.btnDangerText}>🗑 Delete</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {isLoaded && (
                        <View style={styles.buttonSplitRow}>
                          <View style={styles.activeRamBanner}>
                            <Text style={styles.activeRamBannerText}>✓ Active for Offline Chat</Text>
                          </View>
                          <TouchableOpacity style={styles.btnUnload} onPress={() => unloadModel(model)} activeOpacity={0.8}>
                            <Text style={styles.btnUnloadText}>Unload</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {st.status === 'error' && (
                        <View style={styles.buttonSplitRow}>
                          <TouchableOpacity style={styles.btnPrimary} onPress={() => downloadModel(model)} activeOpacity={0.8}>
                            <Text style={styles.btnPrimaryText}>🔄 Retry Download</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.btnDanger} onPress={() => deleteModel(model)} activeOpacity={0.8}>
                            <Text style={styles.btnDangerText}>Reset</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}

              <View style={styles.modelNoteBox}>
                <Text style={styles.modelNoteText}>
                  💡 <Text style={{ fontWeight: '700' }}>Note:</Text> Only one model is loaded in RAM at a time to preserve device memory and battery life.
                </Text>
              </View>
            </ScrollView>
          </View>
        )}

        {/* ========================================== */}
        {/* TAB 3: SETTINGS & INFERENCE PARAMETERS */}
        {/* ========================================== */}
        {activeTab === 'settings' && (
          <View style={styles.tabContentContainer}>
            <ScrollView contentContainerStyle={styles.settingsScrollContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionHeaderTitle}>INFERENCE PARAMETERS</Text>
              <View style={styles.settingsCard}>
                {/* Temperature */}
                <View style={styles.settingRowItem}>
                  <View style={styles.settingLabelRow}>
                    <Text style={styles.settingLabelTitle}>Temperature</Text>
                    <Text style={styles.settingCurrentVal}>{temperature}</Text>
                  </View>
                  <Text style={styles.settingDescText}>
                    Controls creativity. Lower values produce deterministic output; higher values allow expressive phrasing.
                  </Text>
                  <View style={styles.pillsRow}>
                    {[
                      { val: 0.2, label: '0.2 (Precise)' },
                      { val: 0.7, label: '0.7 (Balanced)' },
                      { val: 1.0, label: '1.0 (Creative)' },
                    ].map((opt) => (
                      <TouchableOpacity
                        key={opt.val}
                        style={[styles.pillBtn, temperature === opt.val && styles.pillBtnActive]}
                        onPress={() => setTemperature(opt.val)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.pillBtnText, temperature === opt.val && styles.pillBtnTextActive]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.settingsDivider} />

                {/* Max Tokens */}
                <View style={styles.settingRowItem}>
                  <View style={styles.settingLabelRow}>
                    <Text style={styles.settingLabelTitle}>Max Response Tokens</Text>
                    <Text style={styles.settingCurrentVal}>{maxTokens}</Text>
                  </View>
                  <Text style={styles.settingDescText}>Maximum output tokens generated per reply.</Text>
                  <View style={styles.pillsRow}>
                    {[
                      { val: 256, label: '256 tokens' },
                      { val: 512, label: '512 tokens' },
                      { val: 1024, label: '1024 tokens' },
                      { val: 1536, label: '1536 tokens' },
                    ].map((opt) => (
                      <TouchableOpacity
                        key={opt.val}
                        style={[styles.pillBtn, maxTokens === opt.val && styles.pillBtnActive]}
                        onPress={() => setMaxTokens(opt.val)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.pillBtnText, maxTokens === opt.val && styles.pillBtnTextActive]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <Text style={styles.sectionHeaderTitle}>PERSONALITY & SYSTEM PROMPT</Text>
              <View style={styles.settingsCard}>
                <View style={styles.promptHeaderRow}>
                  <Text style={styles.settingLabelTitle}>System Instructions</Text>
                  <TouchableOpacity onPress={() => setSystemPrompt(DEFAULT_SYSTEM_PROMPT)} activeOpacity={0.7}>
                    <Text style={styles.resetPromptLink}>Reset</Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.systemPromptInput}
                  value={systemPrompt}
                  onChangeText={setSystemPrompt}
                  multiline
                  numberOfLines={4}
                  placeholder="Enter system prompt instructions for Veresa..."
                  placeholderTextColor={THEME.colors.textTertiary}
                />
              </View>

              <Text style={styles.sectionHeaderTitle}>PRIVACY & SYSTEM DIAGNOSTICS</Text>
              <View style={styles.settingsCard}>
                <View style={styles.privacyRow}>
                  <Text style={styles.privacyIconText}>🔒</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.privacyHeading}>100% On-Device Local AI</Text>
                    <Text style={styles.privacyBodyText}>
                      Conversations stay strictly on your phone. No telemetry, prompts, or audio ever leave your device.
                    </Text>
                  </View>
                </View>

                <View style={styles.settingsDivider} />

                <View style={styles.diagRow}>
                  <Text style={styles.diagLabel}>App Version</Text>
                  <Text style={styles.diagVal}>1.0.0 (Production)</Text>
                </View>
                <View style={styles.diagRow}>
                  <Text style={styles.diagLabel}>Inference Runtime</Text>
                  <Text style={styles.diagVal}>llama.cpp ARM64</Text>
                </View>
                <View style={styles.diagRow}>
                  <Text style={styles.diagLabel}>Active Model</Text>
                  <Text style={[styles.diagVal, isModelReady ? styles.valAccent : styles.valMuted]}>
                    {isModelReady ? selectedModel.name : 'None loaded in RAM'}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        )}

        {/* ========================================== */}
        {/* MODERN LOW-PROFILE BOTTOM NAVIGATION */}
        {/* ========================================== */}
        {!isKeyboardVisible && (
        <View style={styles.bottomNav}>
          <View style={styles.navRow}>
            {[
              { id: 'assistant' as NavigationTab, label: 'Assistant', icon: '💬' },
              { id: 'models' as NavigationTab, label: 'Models', icon: '🧠' },
              { id: 'settings' as NavigationTab, label: 'Settings', icon: '⚙️' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.navTabBtn, isActive && styles.navTabBtnActive]}
                  onPress={() => setActiveTab(tab.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.navIconContainer}>
                    <Text style={styles.navIconText}>{tab.icon}</Text>
                    {tab.id === 'models' && downloadingCount > 0 && (
                      <View style={styles.navDownloadBadge}>
                        <Text style={styles.navDownloadBadgeText}>↓</Text>
                      </View>
                    )}
                    {tab.id === 'assistant' && isModelReady && (
                      <View style={styles.navReadyDot} />
                    )}
                  </View>
                  <Text style={[styles.navLabelText, isActive ? styles.navLabelActive : styles.navLabelInactive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// ==========================================
// 5. STYLES
// ==========================================
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.bgApp,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 4 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bgApp,
  },
  tabContentContainer: {
    flex: 1,
  },

  // Header
  header: {
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.sm,
    paddingBottom: THEME.spacing.md,
    backgroundColor: THEME.colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.borderSubtle,
  },
  headerBrandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusRing: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRingReady: {
    backgroundColor: THEME.colors.successGlow,
  },
  statusRingIdle: {
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotReady: {
    backgroundColor: THEME.colors.success,
  },
  statusDotIdle: {
    backgroundColor: THEME.colors.textSecondary,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    letterSpacing: 1.2,
  },
  brandSubtitle: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modelPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: THEME.radii.sm,
    borderWidth: 1,
  },
  modelPillReady: {
    backgroundColor: THEME.colors.successGlow,
    borderColor: 'rgba(74, 222, 128, 0.4)',
  },
  modelPillIdle: {
    backgroundColor: THEME.colors.bgCard,
    borderColor: THEME.colors.borderSubtle,
  },
  modelPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  modelPillTextReady: {
    color: THEME.colors.success,
  },
  modelPillTextIdle: {
    color: THEME.colors.textSecondary,
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: THEME.radii.full,
  },
  newChatBtnPlus: {
    color: THEME.colors.accent,
    fontSize: 13,
    fontWeight: '800',
    marginTop: -1,
  },
  newChatBtnText: {
    color: THEME.colors.accent,
    fontSize: 11.5,
    fontWeight: '700',
  },

  // Banner Alerts
  bannerAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(56, 189, 248, 0.2)',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.sm + 2,
  },
  bannerAlertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  bannerAlertIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerAlertIcon: {
    fontSize: 16,
  },
  bannerAlertTitle: {
    color: THEME.colors.accent,
    fontSize: 12.5,
    fontWeight: '700',
  },
  bannerAlertSub: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    marginTop: 1.5,
  },
  bannerAlertArrowBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  bannerAlertChevron: {
    color: THEME.colors.accent,
    fontSize: 18,
    fontWeight: '800',
    marginTop: -2,
    marginLeft: 1,
  },
  errorBanner: {
    backgroundColor: THEME.colors.dangerGlow,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    padding: THEME.spacing.sm,
    marginHorizontal: THEME.spacing.md,
    marginTop: THEME.spacing.sm,
    borderRadius: THEME.radii.md,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 12,
  },

  // Chat Scroll & Welcome
  chatScroll: {
    flex: 1,
  },
  chatScrollContent: {
    paddingVertical: THEME.spacing.md,
    paddingBottom: THEME.spacing.xl,
  },
  welcomeContainer: {
    paddingHorizontal: THEME.spacing.lg,
    alignItems: 'center',
    paddingTop: THEME.spacing.sm,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 12.5,
    lineHeight: 18,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 14,
  },
  privacyPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: THEME.colors.borderSubtle,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: THEME.radii.full,
    marginBottom: 24,
  },
  privacyPillText: {
    color: THEME.colors.textTertiary,
    fontSize: 11,
    fontWeight: '600',
  },
  startersHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textSecondary,
    letterSpacing: 1,
    alignSelf: 'flex-start',
    marginBottom: 10,
    paddingLeft: 4,
  },
  startersList: {
    width: '100%',
    gap: 8,
  },
  starterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.bgCard,
    borderWidth: 1,
    borderColor: THEME.colors.borderSubtle,
    borderRadius: THEME.radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  starterCardDisabled: {
    opacity: 0.5,
  },
  starterIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starterIcon: {
    fontSize: 18,
  },
  starterTextGroup: {
    flex: 1,
  },
  starterTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  starterPromptPreview: {
    color: THEME.colors.textSecondary,
    fontSize: 11.5,
    lineHeight: 16,
  },
  starterArrowBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starterArrowText: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },

  // Message Bubbles
  bubbleWrapper: {
    marginVertical: 8,
    paddingHorizontal: THEME.spacing.lg,
  },
  bubbleWrapperUser: {
    alignItems: 'flex-end',
  },
  bubbleWrapperAssistant: {
    alignItems: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  bubbleUser: {
    backgroundColor: THEME.colors.userBubble,
    maxWidth: '78%',
    borderRadius: 20,
    borderBottomRightRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleAssistant: {
    backgroundColor: 'transparent',
    width: '100%',
    maxWidth: '100%',
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  messageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 2,
  },
  messageActionsUser: {
    justifyContent: 'flex-end',
    paddingRight: 2,
  },
  messageActionsAssistant: {
    justifyContent: 'flex-start',
    paddingLeft: 0,
  },
  ghostIconBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
  ghostIconGlyph: {
    color: THEME.colors.textTertiary,
    fontSize: 13,
    fontWeight: '600',
  },
  messageContentText: {
    fontSize: 15.5,
    lineHeight: 23,
  },
  contentUser: {
    color: THEME.colors.userBubbleText,
  },
  contentAssistant: {
    color: THEME.colors.assistantBubbleText,
  },
  metricsBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
    paddingTop: 4,
  },
  metricItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radii.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  metricLabel: {
    color: THEME.colors.textTertiary,
    fontSize: 9.5,
    fontWeight: '600',
  },
  metricVal: {
    color: THEME.colors.success,
    fontSize: 10,
    fontWeight: '700',
  },

  // Streaming Bubble
  streamingWrapper: {
    marginVertical: 8,
    paddingHorizontal: THEME.spacing.lg,
  },
  streamingBubble: {
    backgroundColor: 'transparent',
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  streamingContentText: {
    fontSize: 15.5,
    lineHeight: 23,
    color: THEME.colors.assistantBubbleText,
  },

  // Anchored Bottom Composer
  composerContainer: {
    paddingHorizontal: THEME.spacing.md,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: THEME.colors.bgApp,
  },
  composerContainerKeyboard: {
    paddingBottom: Platform.OS === 'ios' ? 8 : 12,
  },
  composerCard: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: THEME.colors.bgSurface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: THEME.colors.borderStrong,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    minHeight: 52,
    maxHeight: 160,
  },
  composerInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 140,
    color: THEME.colors.textPrimary,
    fontSize: 16,
    lineHeight: 22,
    paddingTop: Platform.OS === 'android' ? 10 : 8,
    paddingBottom: Platform.OS === 'android' ? 10 : 8,
    paddingRight: 8,
    includeFontPadding: false,
  },
  composerButtonSlot: {
    paddingBottom: 2,
    paddingLeft: 4,
  },
  composerSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerSendBtnActive: {
    backgroundColor: THEME.colors.accent,
    shadowColor: THEME.colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 4,
  },
  composerSendBtnDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sendArrowText: {
    fontSize: 19,
    fontWeight: '900',
    lineHeight: 21,
    marginTop: -2,
    textAlign: 'center',
  },
  sendArrowActive: {
    color: '#080C14',
  },
  sendArrowDisabled: {
    color: 'rgba(255, 255, 255, 0.2)',
  },
  composerStopBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 4,
  },
  stopIconSquare: {
    width: 12,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 2.5,
  },

  // Models Screen Styles
  modelsScrollContent: {
    padding: THEME.spacing.lg,
    paddingBottom: 40,
  },
  modelsOverviewCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.bgSurface,
    borderRadius: THEME.radii.lg,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.borderSubtle,
    marginBottom: THEME.spacing.lg,
  },
  overviewCol: {
    flex: 1,
    alignItems: 'center',
  },
  overviewDivider: {
    width: 1,
    backgroundColor: THEME.colors.borderSubtle,
    marginVertical: 4,
  },
  overviewLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: THEME.colors.textTertiary,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  overviewVal: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  valSuccess: { color: THEME.colors.success },
  valMuted: { color: THEME.colors.textSecondary },
  valAccent: { color: THEME.colors.accent },

  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textSecondary,
    letterSpacing: 1,
    marginBottom: THEME.spacing.sm,
    paddingLeft: 2,
  },
  modelCard: {
    backgroundColor: THEME.colors.bgCard,
    borderRadius: THEME.radii.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.borderSubtle,
  },
  modelCardActive: {
    borderColor: 'rgba(74, 222, 128, 0.4)',
    backgroundColor: 'rgba(19, 30, 51, 0.95)',
  },
  modelCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  modelNameRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginRight: 8,
  },
  modelNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  tagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: THEME.radii.sm,
  },
  tagStandard: { backgroundColor: 'rgba(56, 189, 248, 0.15)' },
  tagUnfiltered: { backgroundColor: 'rgba(239, 68, 68, 0.18)' },
  tagFast: { backgroundColor: 'rgba(74, 222, 128, 0.18)' },
  tagUncensored: { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
  tagBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  modelStateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radii.sm,
    borderWidth: 1,
  },
  badgeReady: {
    backgroundColor: THEME.colors.successGlow,
    borderColor: 'rgba(74, 222, 128, 0.5)',
  },
  badgeDownloaded: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  badgeIdle: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modelStateBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  textReady: { color: THEME.colors.success },
  textDownloaded: { color: THEME.colors.accent },
  textIdle: { color: THEME.colors.textSecondary },

  modelDescriptionText: {
    fontSize: 12,
    lineHeight: 18,
    color: THEME.colors.textSecondary,
    marginBottom: 10,
  },
  modelSpecsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  modelSpecsText: {
    fontSize: 11,
    color: THEME.colors.textTertiary,
  },
  modelSpecsDot: {
    color: THEME.colors.textTertiary,
  },
  downloadProgressBox: {
    backgroundColor: THEME.colors.bgApp,
    borderRadius: THEME.radii.md,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.borderSubtle,
    marginBottom: 12,
  },
  downloadProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  downloadingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  downloadingTitleText: {
    color: THEME.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  downloadCancelBtn: {
    backgroundColor: THEME.colors.dangerGlow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radii.sm,
  },
  downloadCancelBtnText: {
    color: THEME.colors.danger,
    fontSize: 11,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    backgroundColor: THEME.colors.borderSubtle,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: THEME.colors.accent,
    borderRadius: 3,
  },
  progressNumbersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressMbText: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  progressPctText: {
    color: THEME.colors.accent,
    fontSize: 11,
    fontWeight: '800',
  },
  modelLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.bgApp,
    padding: 12,
    borderRadius: THEME.radii.md,
    gap: 10,
    marginBottom: 12,
  },
  modelLoadingText: {
    color: THEME.colors.success,
    fontSize: 12,
    fontWeight: '600',
  },
  modelActionsRow: {
    marginTop: 2,
  },
  buttonSplitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnPrimary: {
    backgroundColor: THEME.colors.accent,
    paddingVertical: 12,
    borderRadius: THEME.radii.md,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: THEME.colors.bgApp,
    fontWeight: '800',
    fontSize: 13,
  },
  btnSuccess: {
    flex: 1,
    backgroundColor: THEME.colors.success,
    paddingVertical: 11,
    borderRadius: THEME.radii.md,
    alignItems: 'center',
  },
  btnSuccessText: {
    color: THEME.colors.bgApp,
    fontWeight: '800',
    fontSize: 13,
  },
  btnDanger: {
    backgroundColor: THEME.colors.dangerGlow,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: THEME.radii.md,
    alignItems: 'center',
  },
  btnDangerText: {
    color: THEME.colors.danger,
    fontWeight: '700',
    fontSize: 12,
  },
  activeRamBanner: {
    flex: 1,
    backgroundColor: THEME.colors.successGlow,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.4)',
    paddingVertical: 11,
    borderRadius: THEME.radii.md,
    alignItems: 'center',
  },
  activeRamBannerText: {
    color: THEME.colors.success,
    fontWeight: '700',
    fontSize: 12,
  },
  btnUnload: {
    backgroundColor: THEME.colors.bgSurface,
    borderWidth: 1,
    borderColor: THEME.colors.borderSubtle,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: THEME.radii.md,
  },
  btnUnloadText: {
    color: THEME.colors.textSecondary,
    fontWeight: '600',
    fontSize: 12,
  },
  modelNoteBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: THEME.radii.md,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.colors.borderSubtle,
    marginTop: THEME.spacing.sm,
  },
  modelNoteText: {
    color: THEME.colors.textSecondary,
    fontSize: 11.5,
    lineHeight: 17,
  },

  // Settings Styles
  settingsScrollContent: {
    padding: THEME.spacing.lg,
    paddingBottom: 40,
  },
  settingsCard: {
    backgroundColor: THEME.colors.bgCard,
    borderRadius: THEME.radii.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.xl,
    borderWidth: 1,
    borderColor: THEME.colors.borderSubtle,
  },
  settingRowItem: {
    gap: 8,
  },
  settingLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabelTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  settingCurrentVal: {
    color: THEME.colors.accent,
    fontSize: 13,
    fontWeight: '800',
  },
  settingDescText: {
    fontSize: 12,
    lineHeight: 18,
    color: THEME.colors.textSecondary,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  pillBtn: {
    flex: 1,
    backgroundColor: THEME.colors.bgApp,
    borderWidth: 1,
    borderColor: THEME.colors.borderSubtle,
    borderRadius: THEME.radii.sm,
    paddingVertical: 8,
    alignItems: 'center',
  },
  pillBtnActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: THEME.colors.accent,
  },
  pillBtnText: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  pillBtnTextActive: {
    color: THEME.colors.accent,
    fontWeight: '700',
  },
  settingsDivider: {
    height: 1,
    backgroundColor: THEME.colors.borderSubtle,
    marginVertical: 14,
  },
  promptHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resetPromptLink: {
    color: THEME.colors.accent,
    fontSize: 11,
    fontWeight: '600',
  },
  systemPromptInput: {
    backgroundColor: THEME.colors.bgApp,
    borderRadius: THEME.radii.md,
    borderWidth: 1,
    borderColor: THEME.colors.borderSubtle,
    padding: 12,
    color: THEME.colors.textPrimary,
    fontSize: 13,
    lineHeight: 19,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  privacyRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  privacyIconText: {
    fontSize: 22,
    marginTop: 2,
  },
  privacyHeading: {
    color: THEME.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  privacyBodyText: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  diagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 3,
  },
  diagLabel: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
  },
  diagVal: {
    color: THEME.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },

  // Bottom Navigation
  bottomNav: {
    backgroundColor: THEME.colors.bgSurface,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.borderSubtle,
    paddingTop: THEME.spacing.xs,
    paddingBottom: THEME.spacing.sm,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
  },
  navTabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: THEME.radii.md,
  },
  navTabBtnActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  navIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconText: {
    fontSize: 18,
    marginBottom: 2,
  },
  navLabelText: {
    fontSize: 11,
    fontWeight: '600',
  },
  navLabelActive: {
    color: THEME.colors.accent,
    fontWeight: '700',
  },
  navLabelInactive: {
    color: THEME.colors.textSecondary,
  },
  navDownloadBadge: {
    position: 'absolute',
    top: -2,
    right: -6,
    backgroundColor: THEME.colors.accent,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navDownloadBadgeText: {
    color: THEME.colors.bgApp,
    fontSize: 9,
    fontWeight: '900',
  },
  navReadyDot: {
    position: 'absolute',
    top: 0,
    right: -4,
    backgroundColor: THEME.colors.success,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
