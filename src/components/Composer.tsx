import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { THEME } from '../theme/tokens';

interface ComposerProps {
  inputText: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onStop: () => void;
  isModelReady: boolean;
  isGenerating: boolean;
  canSend: boolean;
  isKeyboardVisible: boolean;
  onFocus?: () => void;
}

export function Composer({
  inputText,
  onChangeText,
  onSend,
  onStop,
  isModelReady,
  isGenerating,
  canSend,
  isKeyboardVisible,
  onFocus,
}: ComposerProps) {
  return (
    <View style={[styles.composerContainer, isKeyboardVisible && styles.composerContainerKeyboard]}>
      <View style={styles.composerCard}>
        <TextInput
          style={styles.composerInput}
          placeholder={isModelReady ? 'Message Veresa' : 'Load a model to start chatting'}
          placeholderTextColor={THEME.colors.textTertiary}
          value={inputText}
          onChangeText={onChangeText}
          editable={isModelReady}
          onFocus={onFocus}
          multiline
          maxLength={2000}
          textAlignVertical="top"
          scrollEnabled
          blurOnSubmit={false}
          underlineColorAndroid="transparent"
        />

        <View style={styles.composerButtonSlot}>
          {isGenerating ? (
            <TouchableOpacity style={styles.composerStopBtn} onPress={onStop} activeOpacity={0.8}>
              <View style={styles.stopIconSquare} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.composerSendBtn,
                canSend ? styles.composerSendBtnActive : styles.composerSendBtnDisabled,
              ]}
              onPress={onSend}
              disabled={!canSend}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.sendArrowText,
                  canSend ? styles.sendArrowActive : styles.sendArrowDisabled,
                ]}
              >
                ↑
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  composerContainer: {
    paddingHorizontal: THEME.spacing.md,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: THEME.colors.bgApp,
  },
  composerContainerKeyboard: {
    paddingBottom: Platform.OS === 'ios' ? 8 : 12,
  },
  composerCard: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: THEME.colors.bgSurface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: THEME.colors.borderStrong,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    minHeight: 52,
    maxHeight: 160,
  },
  composerInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 140,
    color: THEME.colors.textPrimary,
    fontSize: 16,
    lineHeight: 22,
    paddingTop: Platform.OS === 'android' ? 10 : 8,
    paddingBottom: Platform.OS === 'android' ? 10 : 8,
    paddingRight: 8,
    includeFontPadding: false,
  },
  composerButtonSlot: {
    paddingBottom: 2,
    paddingLeft: 4,
  },
  composerSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerSendBtnActive: {
    backgroundColor: THEME.colors.accent,
    shadowColor: THEME.colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 4,
  },
  composerSendBtnDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sendArrowText: {
    fontSize: 19,
    fontWeight: '900',
    lineHeight: 21,
    marginTop: -2,
    textAlign: 'center',
  },
  sendArrowActive: {
    color: '#080C14',
  },
  sendArrowDisabled: {
    color: 'rgba(255, 255, 255, 0.2)',
  },
  composerStopBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 4,
  },
  stopIconSquare: {
    width: 12,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 2.5,
  },
});
