import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  StyleSheet,
  Platform,
} from 'react-native';
import { THEME } from '../theme/tokens';
import { Message, ModelState } from '../types';
import { STARTER_PROMPTS } from '../constants/models';
import { AnimatedOrb } from '../components/common/AnimatedOrb';
import { TypingDots } from '../components/common/TypingDots';
import { MessageContentRenderer } from '../components/common/MessageContentRenderer';
import { MessageItem } from '../components/MessageItem';
import { Composer } from '../components/Composer';

interface AssistantScreenProps {
  isModelReady: boolean;
  activeState: ModelState;
  errorMsg: string | null;
  messages: Message[];
  streamingText: string;
  isGenerating: boolean;
  inputText: string;
  onChangeInputText: (text: string) => void;
  onSendMessage: (promptOverride?: string) => void;
  onStopGeneration: () => void;
  canSend: boolean;
  isKeyboardVisible: boolean;
  expandedMetricsId: string | null;
  onToggleMetrics: (id: string) => void;
  copiedMessageId: string | null;
  onCopyMessage: (id: string, content: string) => void;
  onOpenModels: () => void;
  scrollViewRef: React.RefObject<ScrollView | null>;
  userScrolledUpRef: React.MutableRefObject<boolean>;
  onScroll: (event: any) => void;
}

export function AssistantScreen({
  isModelReady,
  activeState,
  errorMsg,
  messages,
  streamingText,
  isGenerating,
  inputText,
  onChangeInputText,
  onSendMessage,
  onStopGeneration,
  canSend,
  isKeyboardVisible,
  expandedMetricsId,
  onToggleMetrics,
  copiedMessageId,
  onCopyMessage,
  onOpenModels,
  scrollViewRef,
  userScrolledUpRef,
  onScroll,
}: AssistantScreenProps) {
  return (
    <KeyboardAvoidingView
      style={styles.tabContentContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
      {/* Banner Alert if no model loaded */}
      {!isModelReady && (
        <TouchableOpacity style={styles.bannerAlert} onPress={onOpenModels} activeOpacity={0.8}>
          <View style={styles.bannerAlertLeft}>
            <View style={styles.bannerAlertIconBadge}>
              <Text style={styles.bannerAlertIcon}>
                {activeState.status === 'downloaded'
                  ? '⚡'
                  : activeState.status === 'downloading'
                  ? '📥'
                  : '🧠'}
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
        onScroll={onScroll}
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
                  onPress={() => onSendMessage(item.prompt)}
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
        {messages.map((m) => (
          <MessageItem
            key={m.id}
            message={m}
            isExpanded={expandedMetricsId === m.id}
            copied={copiedMessageId === m.id}
            onCopy={() => onCopyMessage(m.id, m.content)}
            onToggleMetrics={() => onToggleMetrics(m.id)}
          />
        ))}

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
      <Composer
        inputText={inputText}
        onChangeText={onChangeInputText}
        onSend={() => onSendMessage()}
        onStop={onStopGeneration}
        isModelReady={isModelReady}
        isGenerating={isGenerating}
        canSend={canSend}
        isKeyboardVisible={isKeyboardVisible}
        onFocus={() => {
          userScrolledUpRef.current = false;
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 120);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  tabContentContainer: {
    flex: 1,
  },
  bannerAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.borderSubtle,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: 10,
  },
  bannerAlertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  bannerAlertIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerAlertIcon: {
    fontSize: 15,
  },
  bannerAlertTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 12.5,
    fontWeight: '700',
  },
  bannerAlertSub: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  bannerAlertArrowBadge: {
    paddingLeft: 8,
  },
  bannerAlertChevron: {
    color: THEME.colors.textSecondary,
    fontSize: 18,
    fontWeight: '300',
  },
  errorBanner: {
    backgroundColor: THEME.colors.dangerGlow,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: 8,
  },
  errorText: {
    color: THEME.colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  chatScroll: {
    flex: 1,
  },
  chatScrollContent: {
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.md,
    paddingBottom: 24,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 20,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginTop: 4,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  privacyPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: THEME.radii.full,
    marginTop: 14,
    marginBottom: 24,
  },
  privacyPillText: {
    color: THEME.colors.accent,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  startersHeader: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  startersList: {
    width: '100%',
    gap: 8,
  },
  starterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.bgCard,
    borderRadius: THEME.radii.md,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.colors.borderSubtle,
    gap: 12,
  },
  starterCardDisabled: {
    opacity: 0.5,
  },
  starterIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: THEME.colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starterIcon: {
    fontSize: 16,
  },
  starterTextGroup: {
    flex: 1,
  },
  starterTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  starterPromptPreview: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },
  starterArrowBadge: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starterArrowText: {
    color: THEME.colors.accent,
    fontSize: 14,
    fontWeight: '800',
  },
  streamingWrapper: {
    marginVertical: 4,
    width: '100%',
  },
  streamingBubble: {
    backgroundColor: 'transparent',
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
});
