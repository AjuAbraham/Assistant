import React from 'react';
import { View, Text, TouchableOpacity, Share, Clipboard, StyleSheet } from 'react-native';
import { THEME } from '../theme/tokens';
import { Message } from '../types';
import { MessageContentRenderer } from './common/MessageContentRenderer';
import { CopyIcon, CheckIcon } from './common/Icons';

interface MessageItemProps {
  message: Message;
  isExpanded: boolean;
  copied: boolean;
  onCopy: () => void;
  onToggleMetrics: () => void;
}

export function MessageItem({
  message,
  isExpanded,
  copied,
  onCopy,
  onToggleMetrics,
}: MessageItemProps) {
  const isUser = message.role === 'user';

  return (
    <View
      style={[
        styles.bubbleWrapper,
        isUser ? styles.bubbleWrapperUser : styles.bubbleWrapperAssistant,
      ]}
    >
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <MessageContentRenderer content={message.content} isUser={isUser} />
      </View>

      <View
        style={[
          styles.messageActions,
          isUser ? styles.messageActionsUser : styles.messageActionsAssistant,
        ]}
      >
        <TouchableOpacity
          style={styles.ghostIconBtn}
          onPress={onCopy}
          activeOpacity={0.6}
          accessibilityLabel="Copy message"
        >
          {copied ? (
            <CheckIcon size={13} color="#10B981" />
          ) : (
            <CopyIcon size={13} color={THEME.colors.textTertiary} />
          )}
        </TouchableOpacity>

        {!isUser && (
          <TouchableOpacity
            style={styles.ghostIconBtn}
            onPress={() => Share.share({ message: message.content })}
            activeOpacity={0.6}
            accessibilityLabel="Share message"
          >
            <Text style={styles.ghostIconGlyph}>↗</Text>
          </TouchableOpacity>
        )}

        {!isUser && message.metrics && (
          <TouchableOpacity
            style={styles.ghostIconBtn}
            onPress={onToggleMetrics}
            activeOpacity={0.6}
            accessibilityLabel="Toggle stats"
          >
            <Text style={styles.ghostIconGlyph}>{isExpanded ? '×' : 'i'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {!isUser && message.metrics && isExpanded && (
        <View style={styles.metricsBox}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Speed</Text>
            <Text style={styles.metricVal}>{message.metrics.tokensPerSec} t/s</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>TTFT (Native)</Text>
            <Text style={styles.metricVal}>{message.metrics.ttftMs}ms</Text>
          </View>
          {message.metrics.firstVisibleMs !== undefined && (
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>TTFT (Visible)</Text>
              <Text style={styles.metricVal}>{message.metrics.firstVisibleMs}ms</Text>
            </View>
          )}
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Tokens</Text>
            <Text style={styles.metricVal}>{message.metrics.totalTokens}</Text>
          </View>
          {message.metrics.promptTokens !== undefined && (
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Prompt Tok</Text>
              <Text style={styles.metricVal}>{message.metrics.promptTokens}</Text>
            </View>
          )}
          {message.metrics.promptMs !== undefined && (
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Prompt Time</Text>
              <Text style={styles.metricVal}>{message.metrics.promptMs}ms</Text>
            </View>
          )}
          {message.metrics.hadThinking !== undefined && (
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Had &lt;think&gt;</Text>
              <Text
                style={[
                  styles.metricVal,
                  { color: message.metrics.hadThinking ? '#F59E0B' : '#10B981' },
                ]}
              >
                {message.metrics.hadThinking
                  ? `YES (~${message.metrics.thinkingTokens || 0}t)`
                  : 'NO (0t)'}
              </Text>
            </View>
          )}
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Time</Text>
            <Text style={styles.metricVal}>{message.metrics.durationSec}s</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bubbleWrapper: {
    marginVertical: 4,
    width: '100%',
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
    fontSize: 10,
    color: THEME.colors.textTertiary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metricVal: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    fontWeight: '700',
  },
});
