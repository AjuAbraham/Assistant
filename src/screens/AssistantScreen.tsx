import React, { useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../theme/tokens';
import { Message, LLMConfig, ModelStatus } from '../types';
import { Orb } from '../components/Orb';
import { MessageItem } from '../components/MessageItem';
import { Composer } from '../components/Composer';

interface AssistantScreenProps {
  messages: Message[];
  selectedModel: LLMConfig;
  modelStatus: ModelStatus;
  isModelReady: boolean;
  isGenerating: boolean;
  streamingText: string;
  inputText: string;
  onChangeInputText: (text: string) => void;
  onSendMessage: (promptOverride?: string) => void;
  onStopGeneration: () => void;
  onOpenModelsTab: () => void;
  errorMsg: string | null;
}

const STARTER_PROMPTS = [
  { icon: '💡', title: 'Explain a Concept', prompt: 'Explain quantum computing in simple terms with an analogy.' },
  { icon: '🐍', title: 'Write Python Code', prompt: 'Write a Python script that parses JSON from a file and formats it.' },
  { icon: '🔒', title: 'Why Local AI?', prompt: 'What are the main advantages of running AI models locally on-device?' },
  { icon: '✍️', title: 'Draft an Email', prompt: 'Help me draft a concise and polite follow-up email to a colleague.' },
];

export const AssistantScreen: React.FC<AssistantScreenProps> = ({
  messages,
  selectedModel,
  modelStatus,
  isModelReady,
  isGenerating,
  streamingText,
  inputText,
  onChangeInputText,
  onSendMessage,
  onStopGeneration,
  onOpenModelsTab,
  errorMsg,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const userScrolledUpRef = useRef<boolean>(false);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 80;
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    userScrolledUpRef.current = !isAtBottom;
  };

  const handleFocus = () => {
    userScrolledUpRef.current = false;
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 200);
  };

  return (
    <View style={styles.screenContainer}>
      {/* Offline Status / Model Alert (if model is not loaded) */}
      {!isModelReady && (
        <TouchableOpacity style={styles.bannerAlert} onPress={onOpenModelsTab} activeOpacity={0.8}>
          <View style={styles.bannerAlertLeft}>
            <Text style={styles.bannerAlertIcon}>
              {modelStatus === 'downloaded' ? '⚡' : modelStatus === 'downloading' ? '📥' : '🧠'}
            </Text>
            <View>
              <Text style={styles.bannerAlertTitle}>
                {modelStatus === 'downloaded'
                  ? 'Model downloaded. Tap to load into RAM.'
                  : modelStatus === 'downloading'
                  ? 'Downloading model in background...'
                  : 'No model loaded in RAM'}
              </Text>
              <Text style={styles.bannerAlertSubtitle}>
                {modelStatus === 'downloaded'
                  ? 'Tap here to activate offline inference'
                  : 'Tap to visit Model Library'}
              </Text>
            </View>
          </View>
          <Text style={styles.bannerAlertArrow}>→</Text>
        </TouchableOpacity>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
        </View>
      )}

      {/* Main Conversation Stream / Welcome Screen */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatScroll}
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
        {messages.length === 0 && !streamingText && (
          <View style={styles.welcomeContainer}>
            <Orb isReady={isModelReady} />

            <Text style={styles.welcomeTitle}>Good day, I'm Veresa</Text>
            <Text style={styles.welcomeSubtitle}>
              Your private, 100% offline assistant running directly on this phone.
            </Text>

            <View style={styles.privacyBadge}>
              <Text style={styles.privacyBadgeText}>🔒 On-Device Processing • Zero Data Leaves Phone</Text>
            </View>

            {/* Quick Starters Grid */}
            <Text style={styles.startersHeader}>Suggested Starters</Text>
            <View style={styles.startersGrid}>
              {STARTER_PROMPTS.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.starterCard, !isModelReady && styles.starterCardDisabled]}
                  onPress={() => onSendMessage(item.prompt)}
                  disabled={!isModelReady || isGenerating}
                  activeOpacity={0.7}
                >
                  <Text style={styles.starterIcon}>{item.icon}</Text>
                  <View style={styles.starterTextGroup}>
                    <Text style={styles.starterTitle}>{item.title}</Text>
                    <Text style={styles.starterPromptPreview} numberOfLines={2}>
                      "{item.prompt}"
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Message History */}
        {messages.map((m) => (
          <MessageItem key={m.id} message={m} model={selectedModel} />
        ))}

        {/* Live Streaming Response Bubble */}
        {isGenerating && streamingText !== '' && (
          <View style={styles.streamingBubbleWrapper}>
            <View style={styles.streamingBubble}>
              <View style={styles.streamingHeader}>
                <View style={styles.streamingTagGroup}>
                  <ActivityIndicator size="small" color={theme.colors.accent} />
                  <Text style={styles.streamingRoleTag}>VERESA (Generating...)</Text>
                </View>
                <TouchableOpacity onPress={onStopGeneration} style={styles.streamingStopBtn} activeOpacity={0.7}>
                  <Text style={styles.streamingStopBtnText}>⏹ Stop</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.streamingContentText}>{streamingText}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Anchored Message Composer */}
      <Composer
        inputText={inputText}
        onChangeText={onChangeInputText}
        onSend={() => onSendMessage()}
        onStop={onStopGeneration}
        isGenerating={isGenerating}
        isModelReady={isModelReady}
        onFocus={handleFocus}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: theme.colors.bgApp,
  },
  bannerAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(56, 189, 248, 0.2)',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  bannerAlertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  bannerAlertIcon: {
    fontSize: 16,
  },
  bannerAlertTitle: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  bannerAlertSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  bannerAlertArrow: {
    color: theme.colors.accent,
    fontSize: 16,
    fontWeight: '700',
    paddingLeft: 8,
  },
  errorBanner: {
    backgroundColor: theme.colors.dangerGlow,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    padding: theme.spacing.sm,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
    borderRadius: theme.radii.md,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 12,
  },
  chatScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  welcomeContainer: {
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
  },
  welcomeTitle: {
    ...theme.typography.titleLarge,
    textAlign: 'center',
    marginBottom: 6,
  },
  welcomeSubtitle: {
    ...theme.typography.bodySmall,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
    marginBottom: 14,
  },
  privacyBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.radii.full,
    marginBottom: 24,
  },
  privacyBadgeText: {
    color: theme.colors.textTertiary,
    fontSize: 11,
    fontWeight: '600',
  },
  startersHeader: {
    ...theme.typography.sectionHeader,
    alignSelf: 'flex-start',
    marginBottom: 10,
    paddingLeft: 4,
  },
  startersGrid: {
    width: '100%',
    gap: 8,
  },
  starterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.md,
    padding: 12,
    gap: 12,
  },
  starterCardDisabled: {
    opacity: 0.6,
  },
  starterIcon: {
    fontSize: 20,
  },
  starterTextGroup: {
    flex: 1,
  },
  starterTitle: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  starterPromptPreview: {
    color: theme.colors.textSecondary,
    fontSize: 11.5,
    lineHeight: 16,
  },
  streamingBubbleWrapper: {
    marginVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  streamingBubble: {
    backgroundColor: theme.colors.assistantBubble,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    borderRadius: theme.radii.lg,
    borderBottomLeftRadius: theme.radii.xs,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  streamingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  streamingTagGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streamingRoleTag: {
    color: theme.colors.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  streamingStopBtn: {
    backgroundColor: theme.colors.dangerGlow,
    borderWidth: 1,
    borderColor: theme.colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.sm,
  },
  streamingStopBtnText: {
    color: theme.colors.danger,
    fontSize: 10,
    fontWeight: '800',
  },
  streamingContentText: {
    ...theme.typography.body,
    color: theme.colors.assistantBubbleText,
  },
});
