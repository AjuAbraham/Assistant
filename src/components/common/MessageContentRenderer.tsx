import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { parseMessageSegments } from '../../utils/prompt';
import { CodeBlockCard } from './CodeBlockCard';
import { THEME } from '../../theme/tokens';

export function MessageContentRenderer({ content, isUser }: { content: string; isUser: boolean }) {
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

const styles = StyleSheet.create({
  messageContentText: {
    fontSize: 15,
    lineHeight: 22,
  },
  contentUser: {
    color: THEME.colors.userBubbleText,
  },
  contentAssistant: {
    color: THEME.colors.assistantBubbleText,
  },
});
