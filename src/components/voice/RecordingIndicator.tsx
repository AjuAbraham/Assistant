import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { THEME } from '../../theme/tokens';

interface RecordingIndicatorProps {
  durationSec: number;
  isTranscribing?: boolean;
  statusLabel?: string | null;
  onCancel: () => void;
  onStop: () => void;
}

export function RecordingIndicator({
  durationSec,
  isTranscribing = false,
  statusLabel,
  onCancel,
  onStop,
}: RecordingIndicatorProps) {
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isTranscribing) return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1.0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [blinkAnim, isTranscribing]);

  const minutes = Math.floor(durationSec / 60);
  const seconds = durationSec % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  if (isTranscribing) {
    return (
      <View style={[styles.container, styles.transcribingContainer]}>
        <View style={styles.leftGroup}>
          <ActivityIndicator size="small" color={THEME.colors.accent} />
          <Text style={styles.transcribingLabel}>
            {statusLabel || 'Converting speech to text...'}
          </Text>
        </View>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel} activeOpacity={0.7}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.leftGroup}>
        <Animated.View style={[styles.redDot, { opacity: blinkAnim }]} />
        <Text style={styles.recordingLabel}>Listening</Text>
        <Text style={styles.timeLabel}>{timeFormatted}</Text>
      </View>

      <View style={styles.rightGroup}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel} activeOpacity={0.7}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.doneButton} onPress={onStop} activeOpacity={0.8}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(239, 68, 68, 0.25)',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 8,
  },
  transcribingContainer: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderTopColor: 'rgba(56, 189, 248, 0.25)',
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.danger,
  },
  recordingLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.danger,
  },
  transcribingLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.accent,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cancelButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.radii.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  cancelText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  doneButton: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: THEME.radii.sm,
    backgroundColor: THEME.colors.accent,
  },
  doneText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#080C14',
  },
});
