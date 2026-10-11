import React from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Text } from 'react-native';
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
          placeholder={
            isModelReady
              ? isGenerating
                ? 'Veresa is thinking...'
                : 'Ask Veresa anything offline...'
              : 'Load a model into RAM to start chatting...'
          }
          placeholderTextColor={theme.colors.textTertiary}
          value={inputText}
          onChangeText={onChangeText}
          editable={isModelReady && !isGenerating}
          onFocus={onFocus}
          multiline
          maxLength={2000}
        />

        <View style={styles.buttonContainer}>
          {isGenerating ? (
            <TouchableOpacity style={styles.stopButton} onPress={onStop} activeOpacity={0.8}>
              <View style={styles.stopIcon} />
              <Text style={styles.stopText}>Stop</Text>
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
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.bgSurface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 46,
    maxHeight: 120,
  },
  inputField: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    paddingTop: 8,
    paddingBottom: 8,
    paddingRight: 8,
  },
  buttonContainer: {
    paddingBottom: 4,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.danger,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radii.sm,
    gap: 5,
  },
  stopIcon: {
    width: 8,
    height: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  stopText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
