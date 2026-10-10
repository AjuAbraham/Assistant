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
  sizeMB: number;
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
    sizeMB: 986,
    description: 'Abliterated weights for unfiltered, creative, and deep local reasoning.',
    primaryUrl: 'https://huggingface.co/mradermacher/Qwen2.5-1.5B-Instruct-abliterated-i1-GGUF/resolve/main/Qwen2.5-1.5B-Instruct-abliterated.i1-Q4_K_M.gguf',
    mirrorUrl: 'https://hf-mirror.com/mradermacher/Qwen2.5-1.5B-Instruct-abliterated-i1-GGUF/resolve/main/Qwen2.5-1.5B-Instruct-abliterated.i1-Q4_K_M.gguf',
  },
  {
    id: 'standard',
    name: 'Qwen2.5 1.5B (Standard Instruct)',
    tag: 'STANDARD',
    filename: 'Qwen2.5-1.5B-Instruct-Q4_K_M.gguf',
    sizeEst: '986 MB',
    sizeMB: 986,
    description: 'Official Alibaba Qwen2.5 instruct fine-tune with standard alignment.',
    primaryUrl: 'https://huggingface.co/bartowski/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/Qwen2.5-1.5B-Instruct-Q4_K_M.gguf',
    mirrorUrl: 'https://hf-mirror.com/bartowski/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/Qwen2.5-1.5B-Instruct-Q4_K_M.gguf',
  },
];

type ModelState = {
  status: 'not_downloaded' | 'downloading' | 'downloaded' | 'loading' | 'ready' | 'error';
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
  
  // Independent state per model ID
  const [modelStates, setModelStates] = useState<Record<string, ModelState>>({
    uncensored: { status: 'not_downloaded', progress: 0, writtenMB: 0, totalMB: 986 },
    standard: { status: 'not_downloaded', progress: 0, writtenMB: 0, totalMB: 986 },
  });

  const [llmContext, setLlmContext] = useState<LlamaContext | null>(null);
  const [activeModelId, setActiveModelId] = useState<string | null>(null);

  // Chat & Generation State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [streamingText, setStreamingText] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Settings & Prompts Collapsible
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showPrompts, setShowPrompts] = useState<boolean>(false);
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(512);
  const [systemPrompt, setSystemPrompt] = useState<string>('You are Veresa, a helpful, precise, and fast local offline AI assistant running on device.');

  const scrollViewRef = useRef<ScrollView>(null);
  const userScrolledUpRef = useRef<boolean>(false);
  const downloadJobsRef = useRef<Record<string, FileSystem.DownloadResumable>>({});

  const getModelPath = (filename: string) => {
    return `${FileSystem.documentDirectory || ''}${filename}`;
  };

  useEffect(() => {
    checkAllModels();
  }, []);

  const checkAllModels = async () => {
    if (!FileSystem.documentDirectory) return;

    for (const model of LLM_MODELS) {
      if (downloadJobsRef.current[model.id]) continue;

      const path = getModelPath(model.filename);
      try {
        const info = await FileSystem.getInfoAsync(path);
        if (info.exists && (info as any).size > 100 * 1024 * 1024) {
          const sizeMB = Math.round(((info as any).size || 0) / (1024 * 1024));
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

  // Download Model in background with progress
  const downloadModel = async (model: LLMConfig) => {
    try {
      setErrorMsg(null);
      setModelStates((prev) => ({
        ...prev,
        [model.id]: {
          status: 'downloading',
          progress: 0,
          writtenMB: 0,
          totalMB: model.sizeMB,
          error: undefined,
        },
      }));

      const path = getModelPath(model.filename);
      const info = await FileSystem.getInfoAsync(path);
      if (info.exists) {
        await FileSystem.deleteAsync(path, { idempotent: true });
      }

      const downloadResumable = FileSystem.createDownloadResumable(
        model.primaryUrl,
        path,
        {},
        (p) => {
          const expected = p.totalBytesExpectedToWrite > 0 ? p.totalBytesExpectedToWrite : model.sizeMB * 1024 * 1024;
          const pct = Math.min(100, Math.max(0, Math.round((p.totalBytesWritten / expected) * 100)));
          const writtenMB = parseFloat((p.totalBytesWritten / (1024 * 1024)).toFixed(1));
          const totalMB = parseFloat((expected / (1024 * 1024)).toFixed(1));

          setModelStates((prev) => ({
            ...prev,
            [model.id]: {
              ...prev[model.id],
              status: 'downloading',
              progress: pct,
              writtenMB,
              totalMB,
            },
          }));
        }
      );

      downloadJobsRef.current[model.id] = downloadResumable;
      const res = await downloadResumable.downloadAsync();
      delete downloadJobsRef.current[model.id];

      if (res && res.uri) {
        setModelStates((prev) => ({
          ...prev,
          [model.id]: {
            ...prev[model.id],
            status: 'downloaded',
            progress: 100,
          },
        }));
      } else {
        throw new Error('Model download completed without valid URI');
      }
    } catch (e: any) {
      delete downloadJobsRef.current[model.id];
      setModelStates((prev) => ({
        ...prev,
        [model.id]: {
          ...prev[model.id],
          status: 'error',
          error: e.message,
        },
      }));
      setErrorMsg(`Download Failed (${model.name}): ${e.message}`);
    }
  };

  // Cancel Active Download
  const cancelDownload = async (model: LLMConfig) => {
    const job = downloadJobsRef.current[model.id];
    if (job) {
      try {
        await job.cancelAsync();
      } catch (e) {}
      delete downloadJobsRef.current[model.id];
    }
    const path = getModelPath(model.filename);
    try {
      await FileSystem.deleteAsync(path, { idempotent: true });
    } catch (e) {}
    setModelStates((prev) => ({
      ...prev,
      [model.id]: {
        status: 'not_downloaded',
        progress: 0,
        writtenMB: 0,
        totalMB: model.sizeMB,
      },
    }));
  };

  // Delete Model from storage
  const deleteModel = async (model: LLMConfig) => {
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
  };

  // Load Model into RAM via llama.rn
  const loadModelIntoRam = async (model: LLMConfig) => {
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
      const ctx = await initLlama({
        model: path,
        n_ctx: 2048,
        n_threads: 4,
        n_gpu_layers: 0,
      });

      setLlmContext(ctx);
      setActiveModelId(model.id);

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
      setModelStates((prev) => ({
        ...prev,
        [model.id]: { ...prev[model.id], status: 'error', error: e.message },
      }));
      setErrorMsg(`Model Load Failed: ${e.message}`);
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

  // Handle user scroll detection so streaming doesn't yank scroll position
  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 70;
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    userScrolledUpRef.current = !isAtBottom;
  };

  // Stop ongoing LLM generation
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

  // Send message and stream inference
  const sendMessage = async (promptOverride?: string) => {
    const text = (promptOverride || inputText).trim();
    if (!text || !llmContext || isGenerating) return;

    setInputText('');
    setErrorMsg(null);
    userScrolledUpRef.current = false; // Reset so new message auto-scrolls

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsGenerating(true);
    setStreamingText('');

    // Scroll to bottom when sending
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    let accumulated = '';
    const startTime = Date.now();
    let firstTokenTime = 0;
    let tokenCount = 0;

    try {
      let formattedPrompt = `<|im_start|>system\n${systemPrompt}<|im_end|>\n`;
      const history = [...messages, userMessage].slice(-6);
      for (const m of history) {
        formattedPrompt += `<|im_start|>${m.role}\n${m.content}<|im_end|>\n`;
      }
      formattedPrompt += `<|im_start|>assistant\n`;

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

      if (accumulated.trim()) {
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
      }
      setStreamingText('');
    } catch (e: any) {
      if (accumulated.trim()) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `${accumulated.trim()} [stopped]`,
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

  const activeState = modelStates[selectedLlm.id] || {
    status: 'not_downloaded',
    progress: 0,
    writtenMB: 0,
    totalMB: selectedLlm.sizeMB,
  };

  const isCurrentModelReady = activeState.status === 'ready' && llmContext !== null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#080C14" translucent={Platform.OS === 'android'} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top App Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.logoDot} />
            <Text style={styles.appTitle}>VERESA</Text>
            <View style={[styles.statusBadge, isCurrentModelReady ? styles.badgeActive : styles.badgeInactive]}>
              <View style={[styles.statusDotInner, isCurrentModelReady ? styles.dotInnerActive : styles.dotInnerInactive]} />
              <Text style={styles.statusBadgeText}>
                {isCurrentModelReady ? 'READY (RAM)' : activeState.status.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.appSubtitle}>At your service!! • Offline Local Qwen2.5</Text>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
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
          {/* MODEL SELECTION & CONTROL CARD */}
          <View style={styles.modelCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Text style={styles.cardTitleIcon}>⚙️</Text>
                <Text style={styles.cardTitle}>LOCAL ENGINE</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowSettings(!showSettings)}
                style={styles.settingsBadgeBtn}
              >
                <Text style={styles.settingsLink}>{showSettings ? '▲ Hide Settings' : '▼ Model Settings'}</Text>
              </TouchableOpacity>
            </View>

            {/* Model Switcher Tabs */}
            <View style={styles.modelTabs}>
              {LLM_MODELS.map((model) => {
                const st = modelStates[model.id] || { status: 'not_downloaded', progress: 0 };
                const isSelected = selectedLlm.id === model.id;
                return (
                  <TouchableOpacity
                    key={model.id}
                    style={[
                      styles.modelTab,
                      isSelected && styles.modelTabActive,
                    ]}
                    onPress={() => setSelectedLlm(model)}
                  >
                    <Text style={[styles.modelTabText, isSelected && styles.modelTabTextActive]}>
                      {model.id === 'uncensored' ? '🔓 Uncensored' : '🛡 Standard'}
                    </Text>

                    {st.status === 'downloading' && (
                      <View style={styles.tabBadgeDownloading}>
                        <Text style={styles.tabBadgeDownloadingText}>{st.progress}%</Text>
                      </View>
                    )}
                    {st.status === 'downloaded' && (
                      <View style={styles.tabBadgeDownloaded}>
                        <Text style={styles.tabBadgeDownloadedText}>✓</Text>
                      </View>
                    )}
                    {st.status === 'ready' && (
                      <View style={styles.tabBadgeReady}>
                        <Text style={styles.tabBadgeReadyText}>RAM</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.modelDesc}>{selectedLlm.description}</Text>
            <Text style={styles.modelMeta}>File: {selectedLlm.filename} • {selectedLlm.sizeEst}</Text>

            {/* Action Buttons & Real Progress Bar */}
            <View style={styles.actionRow}>
              {activeState.status === 'not_downloaded' && (
                <TouchableOpacity style={styles.btnPrimary} onPress={() => downloadModel(selectedLlm)}>
                  <Text style={styles.btnTextPrimary}>📥 Download Model ({selectedLlm.sizeEst})</Text>
                </TouchableOpacity>
              )}

              {activeState.status === 'downloading' && (
                <View style={styles.downloadCard}>
                  <View style={styles.downloadHeaderRow}>
                    <View style={styles.downloadTitleRow}>
                      <ActivityIndicator color="#38BDF8" size="small" />
                      <Text style={styles.downloadTitle}>Downloading {selectedLlm.tag}...</Text>
                    </View>
                    <TouchableOpacity onPress={() => cancelDownload(selectedLlm)} style={styles.cancelBtn}>
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Visual Progress Bar Track & Animated Fill */}
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${Math.max(3, activeState.progress)}%` },
                      ]}
                    />
                  </View>

                  <View style={styles.progressStatsRow}>
                    <Text style={styles.progressMbText}>
                      {activeState.writtenMB > 0 ? `${activeState.writtenMB} MB` : '0 MB'} / {activeState.totalMB || selectedLlm.sizeMB} MB
                    </Text>
                    <Text style={styles.progressPercentText}>{activeState.progress}%</Text>
                  </View>
                </View>
              )}

              {activeState.status === 'downloaded' && (
                <View style={styles.rowBtns}>
                  <TouchableOpacity style={[styles.btnAccent, { flex: 1, marginRight: 8 }]} onPress={() => loadModelIntoRam(selectedLlm)}>
                    <Text style={styles.btnTextAccent}>⚡ Load Into RAM</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnDanger} onPress={() => deleteModel(selectedLlm)}>
                    <Text style={styles.btnTextDanger}>🗑 Delete</Text>
                  </TouchableOpacity>
                </View>
              )}

              {activeState.status === 'loading' && (
                <View style={styles.downloadProgressBox}>
                  <ActivityIndicator color="#4ADE80" size="small" />
                  <Text style={styles.progressText}>Loading GGUF weights into RAM...</Text>
                </View>
              )}

              {activeState.status === 'ready' && (
                <View style={styles.rowBtns}>
                  <View style={[styles.btnReady, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.btnTextReady}>✓ Model Active in Memory</Text>
                  </View>
                  <TouchableOpacity style={styles.btnUnload} onPress={() => unloadModel(selectedLlm)}>
                    <Text style={styles.btnTextUnload}>Unload</Text>
                  </TouchableOpacity>
                </View>
              )}

              {activeState.status === 'error' && (
                <View style={styles.rowBtns}>
                  <TouchableOpacity style={[styles.btnPrimary, { flex: 1, marginRight: 8 }]} onPress={() => downloadModel(selectedLlm)}>
                    <Text style={styles.btnTextPrimary}>🔄 Retry Download</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnDanger} onPress={() => deleteModel(selectedLlm)}>
                    <Text style={styles.btnTextDanger}>Reset</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Collapsible Settings Drawer */}
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

          {/* DEDICATED SEPARATE CHAT CONTAINER */}
          <View style={styles.chatSectionContainer}>
            <View style={styles.chatSectionHeader}>
              <View style={styles.chatHeaderTitleRow}>
                <View style={styles.chatDot} />
                <Text style={styles.chatSectionTitle}>CONVERSATION</Text>
                {messages.length > 0 && (
                  <View style={styles.msgCountBadge}>
                    <Text style={styles.msgCountText}>{messages.length}</Text>
                  </View>
                )}
              </View>

              {/* Compact Quick Prompts Collapsible Trigger */}
              <TouchableOpacity
                style={styles.quickPromptsTrigger}
                onPress={() => setShowPrompts(!showPrompts)}
              >
                <Text style={styles.quickPromptsTriggerText}>
                  💡 Prompts {showPrompts ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Collapsible Sample Prompts Card */}
            {showPrompts && (
              <View style={styles.promptsDropdownCard}>
                <Text style={styles.promptsDropdownTitle}>Tap a quick starter to ask Veresa:</Text>
                <View style={styles.promptChipsGrid}>
                  {SAMPLE_PROMPTS.map((prompt, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.promptChip}
                      onPress={() => {
                        setShowPrompts(false);
                        sendMessage(prompt.replace(/^[^\s]+\s/, ''));
                      }}
                      disabled={!isCurrentModelReady || isGenerating}
                    >
                      <Text style={styles.promptChipText}>{prompt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Chat Body */}
            {messages.length === 0 && !streamingText && (
              <View style={styles.emptyChatBox}>
                <Text style={styles.emptyChatIcon}>💬</Text>
                <Text style={styles.emptyChatTitle}>No messages yet</Text>
                <Text style={styles.emptyChatSub}>
                  {isCurrentModelReady
                    ? 'Type below or tap "💡 Prompts" to start a local conversation.'
                    : 'Load a model into RAM above to begin offline chat.'}
                </Text>
              </View>
            )}

            {/* Messages List */}
            {messages.map((m) => (
              <View
                key={m.id}
                style={[
                  styles.messageCard,
                  m.role === 'user' ? styles.userMessageCard : styles.assistantMessageCard,
                ]}
              >
                <View style={styles.messageHeader}>
                  <Text style={m.role === 'user' ? styles.userRoleText : styles.assistantRoleText}>
                    {m.role === 'user' ? '👤 YOU' : `🤖 VERESA (${selectedLlm.tag})`}
                  </Text>
                  {m.role === 'assistant' && (
                    <TouchableOpacity
                      onPress={() => Share.share({ message: m.content })}
                      style={styles.shareIconBtn}
                    >
                      <Text style={styles.shareText}>Copy/Share</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.messageContent}>{m.content}</Text>

                {m.metrics && (
                  <View style={styles.metricsContainer}>
                    <View style={styles.metricPill}>
                      <Text style={styles.metricPillLabel}>Speed</Text>
                      <Text style={styles.metricPillVal}>{m.metrics.tokensPerSec} t/s</Text>
                    </View>
                    <View style={styles.metricPill}>
                      <Text style={styles.metricPillLabel}>TTFT</Text>
                      <Text style={styles.metricPillVal}>{m.metrics.ttftMs}ms</Text>
                    </View>
                    <View style={styles.metricPill}>
                      <Text style={styles.metricPillLabel}>Tokens</Text>
                      <Text style={styles.metricPillVal}>{m.metrics.totalTokens}</Text>
                    </View>
                    <View style={styles.metricPill}>
                      <Text style={styles.metricPillLabel}>Time</Text>
                      <Text style={styles.metricPillVal}>{m.metrics.durationSec}s</Text>
                    </View>
                  </View>
                )}
              </View>
            ))}

            {/* Live Streaming Response */}
            {isGenerating && streamingText !== '' && (
              <View style={[styles.messageCard, styles.assistantMessageCard, styles.streamingMessageCard]}>
                <View style={styles.messageHeader}>
                  <View style={styles.streamingHeaderRow}>
                    <ActivityIndicator color="#38BDF8" size="small" />
                    <Text style={styles.assistantRoleText}>🤖 VERESA (Generating...)</Text>
                  </View>
                  <TouchableOpacity onPress={stopGeneration} style={styles.stopHeaderBtn}>
                    <Text style={styles.stopHeaderBtnText}>⏹ Stop</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.messageContent}>{streamingText}</Text>
              </View>
            )}

            {/* EMBEDDED INPUT BAR DIRECTLY INSIDE CHAT CARD */}
            <View style={styles.cardInputBar}>
              {messages.length > 0 && !isGenerating && (
                <TouchableOpacity style={styles.clearBtn} onPress={clearChat}>
                  <Text style={styles.clearBtnText}>Clear</Text>
                </TouchableOpacity>
              )}

              <TextInput
                style={styles.textInput}
                placeholder={isCurrentModelReady ? (isGenerating ? 'Generating response...' : 'Ask Veresa anything offline...') : 'Load model into RAM first...'}
                placeholderTextColor="#64748B"
                value={inputText}
                onChangeText={setInputText}
                editable={isCurrentModelReady && !isGenerating}
                onFocus={() => {
                  userScrolledUpRef.current = false;
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 250);
                }}
                multiline
              />

              {isGenerating ? (
                <TouchableOpacity style={styles.stopBtn} onPress={stopGeneration}>
                  <Text style={styles.stopBtnText}>⏹ Stop</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.sendBtn,
                    (!isCurrentModelReady || !inputText.trim()) && styles.sendBtnDisabled,
                  ]}
                  onPress={() => sendMessage()}
                  disabled={!isCurrentModelReady || !inputText.trim()}
                >
                  <Text style={styles.sendBtnText}>Send</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#080C14',
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
    backgroundColor: '#0E1626',
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 5,
  },
  statusDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotInnerActive: {
    backgroundColor: '#4ADE80',
  },
  dotInnerInactive: {
    backgroundColor: '#94A3B8',
  },
  badgeActive: {
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    borderWidth: 1,
    borderColor: '#4ADE80',
  },
  badgeInactive: {
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    borderWidth: 1,
    borderColor: '#475569',
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
    padding: 14,
    paddingBottom: 80,
  },

  // Model Engine Card
  modelCard: {
    backgroundColor: '#0F172A',
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
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitleIcon: {
    fontSize: 12,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  settingsBadgeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 6,
  },
  settingsLink: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '600',
  },
  modelTabs: {
    flexDirection: 'row',
    backgroundColor: '#080C14',
    borderRadius: 8,
    padding: 3,
    marginBottom: 10,
    gap: 4,
  },
  modelTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    flexDirection: 'row',
    gap: 6,
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
  tabBadgeDownloading: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  tabBadgeDownloadingText: {
    color: '#38BDF8',
    fontSize: 9,
    fontWeight: '800',
  },
  tabBadgeDownloaded: {
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tabBadgeDownloadedText: {
    color: '#4ADE80',
    fontSize: 10,
    fontWeight: '800',
  },
  tabBadgeReady: {
    backgroundColor: 'rgba(74, 222, 128, 0.3)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#4ADE80',
  },
  tabBadgeReadyText: {
    color: '#4ADE80',
    fontSize: 9,
    fontWeight: '800',
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
    marginTop: 4,
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
    color: '#080C14',
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
    color: '#080C14',
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
  downloadCard: {
    backgroundColor: '#080C14',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  downloadHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  downloadTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  downloadTitle: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  cancelBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 4,
  },
  cancelBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#1E293B',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#38BDF8',
    borderRadius: 4,
  },
  progressStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressMbText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  progressPercentText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
  },
  downloadProgressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#080C14',
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
    backgroundColor: '#080C14',
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
    color: '#080C14',
  },

  // Dedicated Chat Container Section
  chatSectionContainer: {
    backgroundColor: '#0C1220',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    minHeight: 280,
  },
  chatSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  chatHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chatDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#4ADE80',
  },
  chatSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  msgCountBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  msgCountText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '700',
  },
  quickPromptsTrigger: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  quickPromptsTriggerText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },

  // Collapsible Prompts Dropdown
  promptsDropdownCard: {
    backgroundColor: '#080C14',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  promptsDropdownTitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginBottom: 8,
    fontWeight: '600',
  },
  promptChipsGrid: {
    gap: 6,
  },
  promptChip: {
    backgroundColor: '#131D31',
    borderWidth: 1,
    borderColor: '#1E2C44',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  promptChipText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '500',
  },

  // Empty State in Chat
  emptyChatBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyChatIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  emptyChatTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyChatSub: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Message Cards & High-Contrast Styling
  messageCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  userMessageCard: {
    backgroundColor: '#1D4ED8',
    alignSelf: 'flex-end',
    maxWidth: '88%',
    borderBottomRightRadius: 2,
  },
  assistantMessageCard: {
    backgroundColor: '#111A2E',
    borderWidth: 1,
    borderColor: '#1E2E4A',
    width: '100%',
    borderBottomLeftRadius: 2,
  },
  streamingMessageCard: {
    borderColor: '#38BDF8',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  streamingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userRoleText: {
    color: '#BFDBFE',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  assistantRoleText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  shareIconBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#1E293B',
    borderRadius: 4,
  },
  shareText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  messageContent: {
    color: '#F8FAFC',
    fontSize: 13.5,
    lineHeight: 21,
  },

  // Metric Pills inside Assistant Bubble
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  metricPill: {
    backgroundColor: '#080C14',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  metricPillLabel: {
    color: '#64748B',
    fontSize: 9.5,
    fontWeight: '600',
  },
  metricPillVal: {
    color: '#4ADE80',
    fontSize: 10,
    fontWeight: '700',
  },

  // Error Banner
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

  // Embedded Chat Input Bar inside the Card
  cardInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    gap: 8,
  },
  clearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  clearBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#080C14',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#F8FAFC',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#1E293B',
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
    color: '#080C14',
    fontWeight: '800',
    fontSize: 12,
  },
  stopBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  stopHeaderBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stopHeaderBtnText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '700',
  },
});
