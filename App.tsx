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
  Dimensions,
  Share,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { initLlama, LlamaContext } from 'llama.rn';

const { width } = Dimensions.get('window');

export type LLMConfig = {
  id: string;
  name: string;
  tag: string;
  filename: string;
  sizeEst: string;
  description: string;
  primaryUrl: string;
  mirrorUrl: string;
};

export const LLM_MODELS: LLMConfig[] = [
  {
    id: 'uncensored',
    name: 'Qwen2.5 1.5B (Uncensored / Abliterated)',
    tag: 'UNCENSORED',
    filename: 'Qwen2.5-1.5B-Instruct-abliterated.i1-Q4_K_M.gguf',
    sizeEst: '986 MB',
    description: 'Abliterated weights for unfiltered, creative and open reasoning.',
    primaryUrl: 'https://huggingface.co/mradermacher/Qwen2.5-1.5B-Instruct-abliterated-i1-GGUF/resolve/main/Qwen2.5-1.5B-Instruct-abliterated.i1-Q4_K_M.gguf',
    mirrorUrl: 'https://hf-mirror.com/mradermacher/Qwen2.5-1.5B-Instruct-abliterated-i1-GGUF/resolve/main/Qwen2.5-1.5B-Instruct-abliterated.i1-Q4_K_M.gguf',
  },
  {
    id: 'standard',
    name: 'Qwen2.5 1.5B (Standard Instruct)',
    tag: 'STANDARD',
    filename: 'Qwen2.5-1.5B-Instruct-Q4_K_M.gguf',
    sizeEst: '986 MB',
    description: 'Official Alibaba Qwen2.5 instruct fine-tune with standard alignment.',
    primaryUrl: 'https://huggingface.co/bartowski/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/Qwen2.5-1.5B-Instruct-Q4_K_M.gguf',
    mirrorUrl: 'https://hf-mirror.com/bartowski/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/Qwen2.5-1.5B-Instruct-Q4_K_M.gguf',
  },
];

type Message = {
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

const SAMPLE_PROMPTS = [
  '⚡ Why is the sky blue?',
  '🐍 Write a Python fibonacci function',
  '💡 Explain quantum computing simply',
  '🎭 Tell me a short story with a twist',
];

export default function App() {
  const [selectedLlm, setSelectedLlm] = useState<LLMConfig>(LLM_MODELS[0]);
  const [llmStatus, setLlmStatus] = useState<'not_downloaded' | 'downloading' | 'downloaded' | 'loading' | 'ready' | 'error'>('not_downloaded');
  const [llmProgress, setLlmProgress] = useState<number>(0);
  const [llmContext, setLlmContext] = useState<LlamaContext | null>(null);
  const [activeModelId, setActiveModelId] = useState<string | null>(null);

  // Chat & Generation State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [streamingText, setStreamingText] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Settings
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(512);
  const [systemPrompt, setSystemPrompt] = useState<string>('You are Veresa, a helpful, precise, and fast local offline AI assistant running on device.');

  const scrollViewRef = useRef<ScrollView>(null);
  const downloadJobRef = useRef<FileSystem.DownloadResumable | null>(null);

  const getModelPath = (filename: string) => {
    return `${FileSystem.documentDirectory || ''}${filename}`;
  };

  useEffect(() => {
    checkModelStatus(selectedLlm);
  }, [selectedLlm]);

  const checkModelStatus = async (model: LLMConfig) => {
    try {
      if (!FileSystem.documentDirectory) return;
      const path = getModelPath(model.filename);
      const info = await FileSystem.getInfoAsync(path);

      if (info.exists && (info as any).size > 100 * 1024 * 1024) {
        if (llmContext && activeModelId === model.id) {
          setLlmStatus('ready');
        } else {
          setLlmStatus('downloaded');
        }
      } else {
        setLlmStatus('not_downloaded');
      }
    } catch (e) {
      console.log('Error checking model status:', e);
    }
  };

  // Download Model
  const downloadModel = async () => {
    try {
      setErrorMsg(null);
      setLlmStatus('downloading');
      setLlmProgress(0);

      const path = getModelPath(selectedLlm.filename);
      const info = await FileSystem.getInfoAsync(path);
      if (info.exists) {
        await FileSystem.deleteAsync(path, { idempotent: true });
      }

      const downloadResumable = FileSystem.createDownloadResumable(
        selectedLlm.primaryUrl,
        path,
        {},
        (p) => {
          const expected = p.totalBytesExpectedToWrite > 0 ? p.totalBytesExpectedToWrite : 986000000;
          const pct = Math.min(100, Math.max(0, Math.round((p.totalBytesWritten / expected) * 100)));
          setLlmProgress(pct);
        }
      );

      downloadJobRef.current = downloadResumable;
      const res = await downloadResumable.downloadAsync();
      downloadJobRef.current = null;

      if (res && res.uri) {
        setLlmStatus('downloaded');
      } else {
        throw new Error('Model download completed without valid URI');
      }
    } catch (e: any) {
      setErrorMsg(`Download Failed: ${e.message}`);
      setLlmStatus('error');
    }
  };

  // Delete Model
  const deleteModel = async () => {
    try {
      if (llmContext && activeModelId === selectedLlm.id) {
        await llmContext.release();
        setLlmContext(null);
        setActiveModelId(null);
      }
      const path = getModelPath(selectedLlm.filename);
      await FileSystem.deleteAsync(path, { idempotent: true });
      setLlmStatus('not_downloaded');
      setLlmProgress(0);
    } catch (e: any) {
      setErrorMsg(`Delete Failed: ${e.message}`);
    }
  };

  // Load Model into RAM via llama.rn
  const loadModelIntoRam = async () => {
    try {
      setErrorMsg(null);
      setLlmStatus('loading');

      if (llmContext) {
        try {
          await llmContext.release();
        } catch (e) {
          console.log('Context release error:', e);
        }
        setLlmContext(null);
        setActiveModelId(null);
      }

      const path = getModelPath(selectedLlm.filename);
      const ctx = await initLlama({
        model: path,
        n_ctx: 2048,
        n_threads: 4,
        n_gpu_layers: 0,
      });

      setLlmContext(ctx);
      setActiveModelId(selectedLlm.id);
      setLlmStatus('ready');
    } catch (e: any) {
      setErrorMsg(`Model Load Failed: ${e.message}`);
      setLlmStatus('error');
    }
  };

  // Unload Model from RAM
  const unloadModel = async () => {
    if (llmContext) {
      try {
        await llmContext.release();
      } catch (e) {}
      setLlmContext(null);
      setActiveModelId(null);
      setLlmStatus('downloaded');
    }
  };

  // Send message and stream inference
  const sendMessage = async (promptOverride?: string) => {
    const text = (promptOverride || inputText).trim();
    if (!text || !llmContext || isGenerating) return;

    setInputText('');
    setErrorMsg(null);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsGenerating(true);
    setStreamingText('');

    try {
      // Build conversation prompt for Qwen2.5 ChatML format
      let formattedPrompt = `<|im_start|>system\n${systemPrompt}<|im_end|>\n`;
      const history = [...messages, userMessage].slice(-6); // last 6 messages
      for (const m of history) {
        formattedPrompt += `<|im_start|>${m.role}\n${m.content}<|im_end|>\n`;
      }
      formattedPrompt += `<|im_start|>assistant\n`;

      const startTime = Date.now();
      let firstTokenTime = 0;
      let tokenCount = 0;
      let accumulated = '';

      await llmContext.completion(
        {
          prompt: formattedPrompt,
          n_predict: maxTokens,
          temperature: temperature,
          stop: ['<|im_end|>', '<|endoftext|>', '<|im_start|>'],
        },
        (data) => {
          const { token } = data;
          if (tokenCount === 0) {
            firstTokenTime = Date.now();
          }
          tokenCount++;
          accumulated += token;
          setStreamingText(accumulated);
        }
      );

      const endTime = Date.now();
      const durationSec = (endTime - startTime) / 1000;
      const ttftMs = firstTokenTime > 0 ? firstTokenTime - startTime : 0;
      const tokensPerSec = durationSec > 0 ? parseFloat((tokenCount / durationSec).toFixed(1)) : 0;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: accumulated.trim(),
        metrics: {
          ttftMs,
          tokensPerSec,
          totalTokens: tokenCount,
          durationSec: parseFloat(durationSec.toFixed(2)),
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingText('');
    } catch (e: any) {
      setErrorMsg(`Generation Error: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setStreamingText('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" translucent={Platform.OS === 'android'} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top App Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.logoDot} />
            <Text style={styles.appTitle}>VERESA</Text>
            <View style={[styles.statusBadge, llmStatus === 'ready' ? styles.badgeActive : styles.badgeInactive]}>
              <Text style={styles.statusBadgeText}>
                {llmStatus === 'ready' ? 'READY (RAM)' : llmStatus.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.appSubtitle}>At your service!!</Text>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {/* MODEL SELECTION & CONTROL CARD */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>LOCAL MODEL SELECTOR</Text>
              <TouchableOpacity onPress={() => setShowSettings(!showSettings)}>
                <Text style={styles.settingsLink}>{showSettings ? '▲ Hide Settings' : '▼ Settings'}</Text>
              </TouchableOpacity>
            </View>

            {/* Model Switcher Tabs */}
            <View style={styles.modelTabs}>
              {LLM_MODELS.map((model) => (
                <TouchableOpacity
                  key={model.id}
                  style={[
                    styles.modelTab,
                    selectedLlm.id === model.id && styles.modelTabActive,
                  ]}
                  onPress={() => setSelectedLlm(model)}
                >
                  <Text style={[styles.modelTabText, selectedLlm.id === model.id && styles.modelTabTextActive]}>
                    {model.id === 'uncensored' ? '🔓 Uncensored' : '🛡 Standard'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modelDesc}>{selectedLlm.description}</Text>
            <Text style={styles.modelMeta}>File: {selectedLlm.filename} • Size: {selectedLlm.sizeEst}</Text>

            {/* Action Buttons based on Model State */}
            <View style={styles.actionRow}>
              {llmStatus === 'not_downloaded' && (
                <TouchableOpacity style={styles.btnPrimary} onPress={downloadModel}>
                  <Text style={styles.btnTextPrimary}>📥 Download Model ({selectedLlm.sizeEst})</Text>
                </TouchableOpacity>
              )}

              {llmStatus === 'downloading' && (
                <View style={styles.downloadProgressBox}>
                  <ActivityIndicator color="#38BDF8" size="small" />
                  <Text style={styles.progressText}>Downloading: {llmProgress}%</Text>
                </View>
              )}

              {llmStatus === 'downloaded' && (
                <View style={styles.rowBtns}>
                  <TouchableOpacity style={[styles.btnAccent, { flex: 1, marginRight: 8 }]} onPress={loadModelIntoRam}>
                    <Text style={styles.btnTextAccent}>⚡ Load Into RAM</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnDanger} onPress={deleteModel}>
                    <Text style={styles.btnTextDanger}>🗑 Delete</Text>
                  </TouchableOpacity>
                </View>
              )}

              {llmStatus === 'loading' && (
                <View style={styles.downloadProgressBox}>
                  <ActivityIndicator color="#4ADE80" size="small" />
                  <Text style={styles.progressText}>Loading GGUF weights into RAM...</Text>
                </View>
              )}

              {llmStatus === 'ready' && (
                <View style={styles.rowBtns}>
                  <View style={[styles.btnReady, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.btnTextReady}>✓ Model Loaded & Active</Text>
                  </View>
                  <TouchableOpacity style={styles.btnUnload} onPress={unloadModel}>
                    <Text style={styles.btnTextUnload}>Unload</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Collapsible Settings */}
            {showSettings && (
              <View style={styles.settingsBox}>
                <Text style={styles.settingLabel}>Temperature: {temperature}</Text>
                <View style={styles.tempButtons}>
                  {[0.2, 0.7, 1.0].map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.tempBtn, temperature === t && styles.tempBtnActive]}
                      onPress={() => setTemperature(t)}
                    >
                      <Text style={[styles.tempBtnText, temperature === t && styles.tempBtnTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.settingLabel, { marginTop: 10 }]}>Max Tokens: {maxTokens}</Text>
                <View style={styles.tempButtons}>
                  {[128, 256, 512].map((tok) => (
                    <TouchableOpacity
                      key={tok}
                      style={[styles.tempBtn, maxTokens === tok && styles.tempBtnActive]}
                      onPress={() => setMaxTokens(tok)}
                    >
                      <Text style={[styles.tempBtnText, maxTokens === tok && styles.tempBtnTextActive]}>{tok}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Error Banner */}
          {errorMsg && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
            </View>
          )}

          {/* CHAT / BENCHMARK HISTORY */}
          {messages.length === 0 && !streamingText && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Offline LLM Ready for Benchmarking</Text>
              <Text style={styles.emptySubtitle}>Select a prompt below or type your own to test inference speed and quality on-device.</Text>

              <View style={styles.sampleChips}>
                {SAMPLE_PROMPTS.map((prompt, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.chip}
                    onPress={() => sendMessage(prompt.replace(/^[^\s]+\s/, ''))}
                    disabled={llmStatus !== 'ready' || isGenerating}
                  >
                    <Text style={styles.chipText}>{prompt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {messages.map((m) => (
            <View
              key={m.id}
              style={[
                styles.messageBox,
                m.role === 'user' ? styles.userMessageBox : styles.assistantMessageBox,
              ]}
            >
              <View style={styles.messageHeader}>
                <Text style={styles.messageRole}>
                  {m.role === 'user' ? '👤 YOU' : `🤖 VERESA (${selectedLlm.tag})`}
                </Text>
                {m.role === 'assistant' && (
                  <TouchableOpacity onPress={() => Share.share({ message: m.content })}>
                    <Text style={styles.shareText}>Share</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.messageContent}>{m.content}</Text>

              {m.metrics && (
                <View style={styles.metricsRow}>
                  <Text style={styles.metricItem}>⚡ Speed: <Text style={styles.metricValue}>{m.metrics.tokensPerSec} t/s</Text></Text>
                  <Text style={styles.metricItem}>⏱ TTFT: <Text style={styles.metricValue}>{m.metrics.ttftMs}ms</Text></Text>
                  <Text style={styles.metricItem}>🔢 Tokens: <Text style={styles.metricValue}>{m.metrics.totalTokens}</Text></Text>
                  <Text style={styles.metricItem}>⏳ Time: <Text style={styles.metricValue}>{m.metrics.durationSec}s</Text></Text>
                </View>
              )}
            </View>
          ))}

          {/* Streaming Response */}
          {isGenerating && streamingText !== '' && (
            <View style={[styles.messageBox, styles.assistantMessageBox]}>
              <View style={styles.messageHeader}>
                <Text style={styles.messageRole}>🤖 VERESA (Generating...)</Text>
              </View>
              <Text style={styles.messageContent}>{streamingText}</Text>
              <ActivityIndicator color="#38BDF8" size="small" style={{ alignSelf: 'flex-start', marginTop: 8 }} />
            </View>
          )}
        </ScrollView>

        {/* INPUT CONTROLS */}
        <View style={styles.inputBar}>
          {messages.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={clearChat}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          )}

          <TextInput
            style={styles.textInput}
            placeholder={llmStatus === 'ready' ? 'Ask Veresa anything offline...' : 'Load model first to chat with Veresa'}
            placeholderTextColor="#64748B"
            value={inputText}
            onChangeText={setInputText}
            editable={llmStatus === 'ready' && !isGenerating}
            multiline
          />

          <TouchableOpacity
            style={[
              styles.sendBtn,
              (llmStatus !== 'ready' || !inputText.trim() || isGenerating) && styles.sendBtnDisabled,
            ]}
            onPress={() => sendMessage()}
            disabled={llmStatus !== 'ready' || !inputText.trim() || isGenerating}
          >
            <Text style={styles.sendBtnText}>{isGenerating ? '•••' : 'Send'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0F19',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 8 : 0,
    paddingBottom: Platform.OS === 'android' ? 10 : 0,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#38BDF8',
    marginRight: 8,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 1.2,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeActive: {
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    borderWidth: 1,
    borderColor: '#4ADE80',
  },
  badgeInactive: {
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    borderWidth: 1,
    borderColor: '#64748B',
  },
  statusBadgeText: {
    color: '#F8FAFC',
    fontSize: 10,
    fontWeight: '700',
  },
  appSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 3,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#131D31',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  settingsLink: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '600',
  },
  modelTabs: {
    flexDirection: 'row',
    backgroundColor: '#0B0F19',
    borderRadius: 8,
    padding: 3,
    marginBottom: 10,
  },
  modelTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  modelTabActive: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  modelTabText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  modelTabTextActive: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  modelDesc: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  modelMeta: {
    color: '#64748B',
    fontSize: 11,
    marginBottom: 12,
  },
  actionRow: {
    marginTop: 6,
  },
  rowBtns: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: '#38BDF8',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnTextPrimary: {
    color: '#0B0F19',
    fontWeight: '800',
    fontSize: 13,
  },
  btnAccent: {
    backgroundColor: '#4ADE80',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnTextAccent: {
    color: '#0B0F19',
    fontWeight: '800',
    fontSize: 13,
  },
  btnDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnTextDanger: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 12,
  },
  btnReady: {
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    borderWidth: 1,
    borderColor: '#4ADE80',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnTextReady: {
    color: '#4ADE80',
    fontWeight: '700',
    fontSize: 12,
  },
  btnUnload: {
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  btnTextUnload: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 12,
  },
  downloadProgressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B0F19',
    padding: 12,
    borderRadius: 8,
    gap: 10,
  },
  progressText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
  },
  settingsBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  settingLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  tempButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  tempBtn: {
    backgroundColor: '#0B0F19',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  tempBtnActive: {
    backgroundColor: '#38BDF8',
  },
  tempBtnText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  tempBtnTextActive: {
    color: '#0B0F19',
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  sampleChips: {
    width: '100%',
    gap: 8,
  },
  chip: {
    backgroundColor: '#131D31',
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  chipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  messageBox: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  userMessageBox: {
    backgroundColor: '#1E293B',
    alignSelf: 'flex-end',
    maxWidth: '90%',
  },
  assistantMessageBox: {
    backgroundColor: '#131D31',
    borderWidth: 1,
    borderColor: '#1E293B',
    width: '100%',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  messageRole: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  shareText: {
    color: '#64748B',
    fontSize: 11,
  },
  messageContent: {
    color: '#F8FAFC',
    fontSize: 13,
    lineHeight: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  metricItem: {
    color: '#64748B',
    fontSize: 10,
  },
  metricValue: {
    color: '#4ADE80',
    fontWeight: '700',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#131D31',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    gap: 8,
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  clearBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#0B0F19',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#F8FAFC',
    fontSize: 13,
    maxHeight: 80,
  },
  sendBtn: {
    backgroundColor: '#38BDF8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  sendBtnDisabled: {
    backgroundColor: '#1E293B',
  },
  sendBtnText: {
    color: '#0B0F19',
    fontWeight: '800',
    fontSize: 12,
  },
});
