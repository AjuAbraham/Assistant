import React from 'react';
import { Platform, StyleSheet, View, TextInput, TouchableOpacity, Text } from 'react-native';
import { theme } from '../theme/tokens';

interface ComposerProps {
  inputText: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onStop: () => void;
  isGenerating: boolean;
  isModelReady: boolean;
  onFocus?: () => void;
}

export const Composer: React.FC<ComposerProps> = ({
  inputText,
  onChangeText,
  onSend,
  onStop,
  isGenerating,
  isModelReady,
  onFocus,
}) => {
  const canSend = isModelReady && inputText.trim().length > 0 && !isGenerating;

  return (
    <View style={styles.composerWrapper}>
      <View style={styles.inputCard}>
        <TextInput
          style={styles.inputField}
          placeholder={isModelReady ? 'Message Veresa' : 'Load a model to start chatting'}
          placeholderTextColor={theme.colors.textTertiary}
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

        <View style={styles.buttonContainer}>
          {isGenerating ? (
            <TouchableOpacity style={styles.stopButton} onPress={onStop} activeOpacity={0.8}>
              <View style={styles.stopIcon} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
              onPress={onSend}
              disabled={!canSend}
              activeOpacity={0.8}
            >
              <Text style={[styles.sendIcon, canSend ? styles.sendIconActive : styles.sendIconDisabled]}>
                ↑
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  composerWrapper: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: theme.colors.bgApp,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: theme.colors.bgSurface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    minHeight: 52,
    maxHeight: 160,
  },
  inputField: {
    flex: 1,
    minHeight: 40,
    maxHeight: 140,
    color: theme.colors.textPrimary,
    fontSize: 16,
    lineHeight: 22,
    paddingTop: Platform.OS === 'android' ? 10 : 8,
    paddingBottom: Platform.OS === 'android' ? 10 : 8,
    paddingRight: 8,
    includeFontPadding: false,
  },
  buttonContainer: {
    paddingBottom: 2,
    paddingLeft: 4,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  sendIcon: {
    fontSize: 18,
    fontWeight: '900',
  },
  sendIconActive: {
    color: theme.colors.bgApp,
  },
  sendIconDisabled: {
    color: theme.colors.textDisabled,
  },
  stopButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopIcon: {
    width: 12,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 2.5,
  },
});
