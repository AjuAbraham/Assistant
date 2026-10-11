import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Share } from 'react-native';
import { theme } from '../theme/tokens';
import { Message, LLMConfig } from '../types';

interface MessageItemProps {
  message: Message;
  model: LLMConfig;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, model }) => {
  const [showMetrics, setShowMetrics] = useState(false);
  const isUser = message.role === 'user';

  const handleShare = () => {
    Share.share({ message: message.content });
  };

  return (
    <View style={[styles.bubbleWrapper, isUser ? styles.wrapperUser : styles.wrapperAssistant]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        {/* Header tag */}
        <View style={styles.bubbleHeader}>
          <Text style={[styles.roleTag, isUser ? styles.roleTagUser : styles.roleTagAssistant]}>
            {isUser ? 'YOU' : `VERESA • ${model.tag}`}
          </Text>

          {!isUser && (
            <View style={styles.assistantActions}>
              {message.metrics && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => setShowMetrics(!showMetrics)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionBtnText}>{showMetrics ? 'Hide Stats' : '⚡ Stats'}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.actionBtn} onPress={handleShare} activeOpacity={0.7}>
                <Text style={styles.actionBtnText}>Share</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Message Content */}
        <Text style={[styles.messageText, isUser ? styles.textUser : styles.textAssistant]} selectable>
          {message.content}
        </Text>

        {/* Expandable Metrics Bar */}
        {!isUser && message.metrics && showMetrics && (
          <View style={styles.metricsBox}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Speed</Text>
              <Text style={styles.metricVal}>{message.metrics.tokensPerSec} t/s</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Latency (TTFT)</Text>
              <Text style={styles.metricVal}>{message.metrics.ttftMs}ms</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Tokens</Text>
              <Text style={styles.metricVal}>{message.metrics.totalTokens}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Duration</Text>
              <Text style={styles.metricVal}>{message.metrics.durationSec}s</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bubbleWrapper: {
    marginVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  wrapperUser: {
    alignItems: 'flex-end',
  },
  wrapperAssistant: {
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: theme.radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bubbleUser: {
    backgroundColor: theme.colors.userBubble,
    maxWidth: '86%',
    borderBottomRightRadius: theme.radii.xs,
  },
  bubbleAssistant: {
    backgroundColor: theme.colors.assistantBubble,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    width: '100%',
    borderBottomLeftRadius: theme.radii.xs,
  },
  bubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  roleTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  roleTagUser: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  roleTagAssistant: {
    color: theme.colors.accent,
  },
  assistantActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: theme.radii.sm,
  },
  actionBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  messageText: {
    ...theme.typography.body,
  },
  textUser: {
    color: theme.colors.userBubbleText,
  },
  textAssistant: {
    color: theme.colors.assistantBubbleText,
  },
  metricsBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
  },
  metricItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  metricLabel: {
    color: theme.colors.textTertiary,
    fontSize: 9.5,
    fontWeight: '600',
  },
  metricVal: {
    color: theme.colors.success,
    fontSize: 10,
    fontWeight: '700',
  },
});
