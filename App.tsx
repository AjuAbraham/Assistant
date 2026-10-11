import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  StatusBar,
  View,
  ScrollView,
  Keyboard,
  Platform,
  Alert,
  Clipboard,
  StyleSheet,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { initLlama, LlamaContext } from 'llama.rn';

import { THEME } from './src/theme/tokens';
import { LLMConfig, ModelState, Message, NavigationTab } from './src/types';
import { LLM_MODELS, DEFAULT_SYSTEM_PROMPT } from './src/constants/models';
import { buildFormattedChatPrompt, stripThinking } from './src/utils/prompt';
import { Header, BottomNav } from './src/components';
import { AssistantScreen, ModelsScreen, SettingsScreen } from './src/screens';
import { useVoiceInput } from './src/hooks/useVoiceInput';
import { SPEECH_MODEL } from './src/constants/speechModels';
import {
  isSpeechModelDownloaded,
  downloadSpeechModel,
  deleteSpeechModel,
} from './src/services/voice/speechModelManager';

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

  // Speech Recognition Model State (Whisper tiny.en)
  const [speechModelState, setSpeechModelState] = useState<ModelState>({
    status: 'not_downloaded',
    progress: 0,
    writtenMB: 0,
    totalMB: SPEECH_MODEL.sizeMB,
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

  // Voice Input (Offline Whisper STT)
  const {
    isRecording,
    isTranscribing,
    transcriptionStatus,
    recordingDurationSec,
    startRecording,
    stopRecording,
    cancelRecording,
    errorMessage: voiceError,
  } = useVoiceInput();

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
    checkSpeechModel();
  }, []);

  const checkSpeechModel = async () => {
    try {
      const isDownloaded = await isSpeechModelDownloaded();
      if (isDownloaded) {
        setSpeechModelState({
          status: 'downloaded',
          progress: 100,
          writtenMB: SPEECH_MODEL.sizeMB,
          totalMB: SPEECH_MODEL.sizeMB,
        });
      }
    } catch (_) {}
  };

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
              setErrorMsg(`Error deleting model: ${e?.message}`);
            }
          },
        },
      ]
    );
  };

  // Download Speech Recognition Model (Whisper tiny.en)
  const handleDownloadSpeechModel = async () => {
    try {
      setSpeechModelState({
        status: 'downloading',
        progress: 0,
        writtenMB: 0,
        totalMB: SPEECH_MODEL.sizeMB,
      });

      await downloadSpeechModel((pct, writtenMB, totalMB) => {
        setSpeechModelState({
          status: 'downloading',
          progress: pct,
          writtenMB,
          totalMB,
        });
      });

      setSpeechModelState({
        status: 'downloaded',
        progress: 100,
        writtenMB: SPEECH_MODEL.sizeMB,
        totalMB: SPEECH_MODEL.sizeMB,
      });
    } catch (e: any) {
      console.error('[App] Failed to download speech model:', e);
      setSpeechModelState((prev) => ({
        ...prev,
        status: 'error',
        error: e?.message || 'Download failed',
      }));
      setErrorMsg(`Voice Model Download Failed: ${e?.message || 'Network error'}`);
    }
  };

  // Delete Speech Recognition Model
  const handleDeleteSpeechModel = () => {
    Alert.alert(
      'Delete Voice Model?',
      `Are you sure you want to delete ${SPEECH_MODEL.name}? You will need to re-download it to use offline voice input.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSpeechModel();
              setSpeechModelState({
                status: 'not_downloaded',
                progress: 0,
                writtenMB: 0,
                totalMB: SPEECH_MODEL.sizeMB,
              });
            } catch (e: any) {
              setErrorMsg(`Error deleting voice model: ${e?.message}`);
            }
          },
        },
      ]
    );
  };

  // Load Model into RAM with safe release of previous context
  const loadModelIntoRam = async (model: LLMConfig) => {
    if (isGenerating) {
      setErrorMsg('Please stop generation before switching models.');
      return;
    }

    try {
      setErrorMsg(null);
      if (llmContext) {
        try {
          await llmContext.release();
        } catch (e) {}
        setLlmContext(null);
        setActiveModelId(null);
      }

      setModelStates((prev) => ({
        ...prev,
        [model.id]: { ...prev[model.id], status: 'loading' },
      }));

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
            // Clean past assistant turns so previous thinking tags never contaminate future turns
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

      // Diagnostic Logging
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

  const handleCopyMessage = (id: string, content: string) => {
    Clipboard.setString(content);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
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

  const totalStorageMB =
    Object.values(modelStates).reduce((acc, st) => {
      return st.status === 'downloaded' || st.status === 'ready' ? acc + (st.writtenMB || 0) : acc;
    }, 0) +
    (speechModelState.status === 'downloaded' || speechModelState.status === 'ready'
      ? speechModelState.writtenMB || SPEECH_MODEL.sizeMB
      : 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={THEME.colors.bgApp}
        translucent={Platform.OS === 'android'}
      />

      <View style={styles.container}>
        {/* UNIVERSAL COMPACT TOP HEADER */}
        <Header
          selectedModel={selectedModel}
          activeState={activeState}
          isModelReady={isModelReady}
          activeTab={activeTab}
          hasMessages={messages.length > 0}
          onOpenModels={() => setActiveTab('models')}
          onClearChat={clearChat}
        />

        {/* TAB 1: ASSISTANT CONVERSATION SCREEN */}
        {activeTab === 'assistant' && (
          <AssistantScreen
            isModelReady={isModelReady}
            activeState={activeState}
            errorMsg={errorMsg || voiceError}
            messages={messages}
            streamingText={streamingText}
            isGenerating={isGenerating}
            inputText={inputText}
            onChangeInputText={setInputText}
            onSendMessage={sendMessage}
            onStopGeneration={stopGeneration}
            canSend={canSend}
            isKeyboardVisible={isKeyboardVisible}
            expandedMetricsId={expandedMetricsId}
            onToggleMetrics={(id) => setExpandedMetricsId((prev) => (prev === id ? null : id))}
            copiedMessageId={copiedMessageId}
            onCopyMessage={handleCopyMessage}
            onOpenModels={() => setActiveTab('models')}
            scrollViewRef={scrollViewRef}
            userScrolledUpRef={userScrolledUpRef}
            onScroll={handleScroll}
            isRecording={isRecording}
            isTranscribing={isTranscribing}
            transcriptionStatus={transcriptionStatus}
            recordingDurationSec={recordingDurationSec}
            onStartRecording={startRecording}
            onStopRecording={async () => {
              const transcript = await stopRecording();
              checkSpeechModel();
              if (transcript && transcript.trim()) {
                const text = transcript.trim();
                if (isModelReady) {
                  // Direct-send to AI immediately
                  sendMessage(text);
                } else {
                  setInputText(text);
                  Alert.alert('Model Not Loaded', 'Please load a model first to chat with Veresa.');
                }
              }
            }}
            onCancelRecording={cancelRecording}
          />
        )}

        {/* TAB 2: MODEL LIBRARY & DOWNLOAD MANAGER */}
        {activeTab === 'models' && (
          <ModelsScreen
            models={LLM_MODELS}
            modelStates={modelStates}
            selectedModel={selectedModel}
            activeModelId={activeModelId}
            isModelReady={isModelReady}
            totalStorageMB={totalStorageMB}
            onDownloadModel={downloadModel}
            onCancelDownload={cancelDownload}
            onLoadModel={loadModelIntoRam}
            onUnloadModel={unloadModel}
            onDeleteModel={deleteModel}
            speechModelState={speechModelState}
            onDownloadSpeechModel={handleDownloadSpeechModel}
            onDeleteSpeechModel={handleDeleteSpeechModel}
          />
        )}

        {/* TAB 3: SETTINGS & INFERENCE PARAMETERS */}
        {activeTab === 'settings' && (
          <SettingsScreen
            temperature={temperature}
            onSetTemperature={setTemperature}
            maxTokens={maxTokens}
            onSetMaxTokens={setMaxTokens}
            systemPrompt={systemPrompt}
            onSetSystemPrompt={setSystemPrompt}
            onResetSystemPrompt={() => setSystemPrompt(DEFAULT_SYSTEM_PROMPT)}
            isModelReady={isModelReady}
            selectedModel={selectedModel}
          />
        )}

        {/* MODERN LOW-PROFILE BOTTOM NAVIGATION */}
        {!isKeyboardVisible && (
          <BottomNav
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            downloadingCount={downloadingCount}
            isModelReady={isModelReady}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

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
});
