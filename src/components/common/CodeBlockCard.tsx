import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform, Clipboard } from 'react-native';
import { CopyIcon, CheckIcon } from './Icons';

export function CodeBlockCard({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = () => {
    Clipboard.setString(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={codeStyles.container}>
      <View style={codeStyles.header}>
        <View style={codeStyles.langTag}>
          <Text style={codeStyles.langDot}>●</Text>
          <Text style={codeStyles.langText}>{language || 'CODE'}</Text>
        </View>
        <TouchableOpacity
          style={[codeStyles.copyBtn, copied && codeStyles.copyBtnActive]}
          onPress={onCopy}
          activeOpacity={0.7}
          accessibilityLabel={copied ? 'Copied' : 'Copy code'}
        >
          {copied ? <CheckIcon size={12} color="#10B981" /> : <CopyIcon size={12} color="#8B949E" />}
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={true} style={codeStyles.scroll}>
        <Text style={codeStyles.codeText} selectable>
          {code}
        </Text>
      </ScrollView>
    </View>
  );
}

const codeStyles = StyleSheet.create({
  container: {
    marginVertical: 8,
    backgroundColor: '#0D1117',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#30363D',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#161B22',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  langTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  langDot: {
    color: '#10B981',
    fontSize: 8,
  },
  langText: {
    color: '#8B949E',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  copyBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  copyBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  scroll: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    lineHeight: 18,
    color: '#E6EDF3',
  },
});
