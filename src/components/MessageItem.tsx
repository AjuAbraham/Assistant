import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Share, Clipboard } from 'react-native';
import { theme } from '../theme/tokens';
import { Message, LLMConfig } from '../types';

interface MessageItemProps {
  message: Message;
  model: LLMConfig;
}

function CopyGlyph({ color }: { color: string }) {
  return (
    <View style={{ width: 13, height: 13 }}>
      <View
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 9,
          height: 9,
          borderRadius: 2,
          borderWidth: 1.1,
          borderColor: color,
          opacity: 0.45,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: 9,
          height: 9,
          borderRadius: 2,
          borderWidth: 1.1,
          borderColor: color,
        }}
      />
    </View>
  );
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, model: _model }) => {
  const [showMetrics, setShowMetrics] = useState(false);
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    Clipboard.setString(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    Share.share({ message: message.content });
  };

  return (
    <View style={[styles.bubbleWrapper, isUser ? styles.wrapperUser : styles.wrapperAssistant]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={[styles.messageText, isUser ? styles.textUser : styles.textAssistant]} selectable>
          {message.content}
        </Text>
      </View>

      <View style={[styles.actions, isUser ? styles.actionsUser : styles.actionsAssistant]}>
        <TouchableOpacity style={styles.ghostBtn} onPress={handleCopy} activeOpacity={0.6}>
          {copied ? (
            <Text style={styles.copiedMark}>✓</Text>
          ) : (
            <CopyGlyph color={theme.colors.textTertiary} />
          )}
        </TouchableOpacity>
        {!isUser && (
          <TouchableOpacity style={styles.ghostBtn} onPress={handleShare} activeOpacity={0.6}>
            <Text style={styles.ghostGlyph}>↗</Text>
          </TouchableOpacity>
        )}
        {!isUser && message.metrics && (
          <TouchableOpacity
            style={styles.ghostBtn}
            onPress={() => setShowMetrics(!showMetrics)}
            activeOpacity={0.6}
          >
            <Text style={styles.ghostGlyph}>{showMetrics ? '×' : 'i'}</Text>
          </TouchableOpacity>
        )}
      </View>

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
  );
};

const styles = StyleSheet.create({
  bubbleWrapper: {
    marginVertical: 8,
    paddingHorizontal: theme.spacing.lg,
  },
  wrapperUser: {
    alignItems: 'flex-end',
  },
  wrapperAssistant: {
    alignItems: 'flex-start',
  },
  bubble: {},
  bubbleUser: {
    backgroundColor: theme.colors.userBubble,
    maxWidth: '78%',
    borderRadius: 20,
    borderBottomRightRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleAssistant: {
    backgroundColor: 'transparent',
    width: '100%',
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 2,
  },
  actionsUser: {
    justifyContent: 'flex-end',
  },
  actionsAssistant: {
    justifyContent: 'flex-start',
  },
  ghostBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
  ghostGlyph: {
    color: theme.colors.textTertiary,
    fontSize: 13,
    fontWeight: '600',
  },
  copiedMark: {
    color: theme.colors.success,
    fontSize: 13,
    fontWeight: '700',
  },
  messageText: {
    ...theme.typography.body,
    fontSize: 15.5,
    lineHeight: 23,
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
    marginTop: 6,
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
