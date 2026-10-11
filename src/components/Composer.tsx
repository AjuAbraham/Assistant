import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { THEME } from '../theme/tokens';
import { MicrophoneButton } from './voice/MicrophoneButton';

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
  isRecording?: boolean;
  isTranscribing?: boolean;
  transcriptionStatus?: string | null;
  recordingDurationSec?: number;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  onCancelRecording?: () => void;
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
  isRecording = false,
  isTranscribing = false,
  transcriptionStatus,
  recordingDurationSec = 0,
  onStartRecording,
  onStopRecording,
  onCancelRecording,
}: ComposerProps) {
  const [isNearCancel, setIsNearCancel] = useState(false);
  const redDotBlink = useRef(new Animated.Value(1)).current;
  const slideChevronAnim = useRef(new Animated.Value(0)).current;

  const hasText = inputText.trim().length > 0;
  const isVoiceBusy = isRecording || isTranscribing;

  // Blinking red dot and sliding chevron animation during recording
  useEffect(() => {
    let dotLoop: Animated.CompositeAnimation | null = null;
    let chevronLoop: Animated.CompositeAnimation | null = null;

    if (isRecording) {
      dotLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(redDotBlink, { toValue: 0.2, duration: 400, useNativeDriver: true }),
          Animated.timing(redDotBlink, { toValue: 1.0, duration: 400, useNativeDriver: true }),
        ])
      );
      dotLoop.start();

      chevronLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(slideChevronAnim, { toValue: -6, duration: 600, useNativeDriver: true }),
          Animated.timing(slideChevronAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        ])
      );
      chevronLoop.start();
    } else {
      setIsNearCancel(false);
      redDotBlink.setValue(1);
      slideChevronAnim.setValue(0);
    }

    return () => {
      dotLoop?.stop();
      chevronLoop?.stop();
    };
  }, [isRecording, redDotBlink, slideChevronAnim]);

  const minutes = Math.floor(recordingDurationSec / 60);
  const seconds = recordingDurationSec % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <View style={[styles.composerContainer, isKeyboardVisible && styles.composerContainerKeyboard]}>
      <View style={[styles.composerCard, isRecording && styles.composerCardRecording]}>
        {isTranscribing ? (
          /* Transcribing state */
          <View style={styles.transcribingRow}>
            <ActivityIndicator size="small" color={THEME.colors.accent} />
            <Text style={styles.transcribingText} numberOfLines={1}>
              {transcriptionStatus || 'Converting voice to text & sending...'}
            </Text>
          </View>
        ) : isRecording ? (
          /* WhatsApp-style Active Voice Recording Row */
          <View style={styles.recordingRow}>
            {/* Blinking red dot & time */}
            <View style={styles.recordingTimerWrap}>
              <Animated.View style={[styles.redDot, { opacity: redDotBlink }]} />
              <Text style={styles.recordingTimerText}>{timeFormatted}</Text>
            </View>

            {/* Slide to cancel indicator */}
            <Animated.View
              style={[
                styles.slideCancelWrap,
                { transform: [{ translateX: slideChevronAnim }] },
              ]}
            >
              <Text style={[styles.slideCancelText, isNearCancel && styles.slideCancelTextActive]}>
                {isNearCancel ? '🗑️ Release to cancel' : '‹ ‹  Slide left to cancel'}
              </Text>
            </Animated.View>

            {/* Optional one-tap Done button */}
            <TouchableOpacity
              style={styles.doneInlineBtn}
              onPress={onStopRecording}
              activeOpacity={0.7}
            >
              <Text style={styles.doneInlineText}>Done</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Standard Text Input */
          <TextInput
            style={styles.composerInput}
            placeholder={isModelReady ? 'Message Veresa' : 'Load a model to start chatting'}
            placeholderTextColor={THEME.colors.textTertiary}
            value={inputText}
            onChangeText={onChangeText}
            editable={isModelReady && !isVoiceBusy}
            onFocus={onFocus}
            multiline
            maxLength={2000}
            textAlignVertical="top"
            scrollEnabled
            blurOnSubmit={false}
            underlineColorAndroid="transparent"
          />
        )}

        {/* Right Action Slot */}
        <View style={styles.composerButtonSlot}>
          {isGenerating ? (
            <TouchableOpacity style={styles.composerStopBtn} onPress={onStop} activeOpacity={0.8}>
              <View style={styles.stopIconSquare} />
            </TouchableOpacity>
          ) : isTranscribing ? (
            <View style={styles.composerSpinnerBtn}>
              <ActivityIndicator size="small" color={THEME.colors.accent} />
            </View>
          ) : hasText && !isRecording ? (
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
          ) : (
            <MicrophoneButton
              isRecording={isRecording}
              onStartRecording={onStartRecording}
              onStopRecording={onStopRecording}
              onCancelRecording={onCancelRecording}
              onSlideCancel={setIsNearCancel}
              disabled={!isModelReady}
            />
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
    alignItems: 'center',
    backgroundColor: THEME.colors.bgSurface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: THEME.colors.borderStrong,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 5,
    minHeight: 52,
    maxHeight: 160,
  },
  composerCardRecording: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
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
  recordingRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingRight: 4,
  },
  recordingTimerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  redDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: THEME.colors.danger,
  },
  recordingTimerText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  slideCancelWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  slideCancelText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: THEME.colors.textTertiary,
  },
  slideCancelTextActive: {
    color: THEME.colors.danger,
    fontWeight: '700',
  },
  doneInlineBtn: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: THEME.radii.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginRight: 4,
  },
  doneInlineText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  transcribingRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    paddingLeft: 4,
  },
  transcribingText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: THEME.colors.accent,
  },
  composerButtonSlot: {
    paddingLeft: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerSendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
  composerSpinnerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendArrowText: {
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 22,
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
    width: 38,
    height: 38,
    borderRadius: 19,
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
