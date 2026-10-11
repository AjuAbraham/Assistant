import { LLMConfig, ParsedSegment } from '../types';

export function parseMessageSegments(raw: string): ParsedSegment[] {
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

export function stripThinking(raw: string): { visible: string; stillThinking: boolean } {
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

export function buildFormattedChatPrompt(
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
