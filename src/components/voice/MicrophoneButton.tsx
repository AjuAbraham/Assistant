import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, View, PanResponder } from 'react-native';
import { THEME } from '../../theme/tokens';
import { MicIcon } from '../common/Icons';

interface MicrophoneButtonProps {
  isRecording: boolean;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  onCancelRecording?: () => void;
  onSlideCancel?: (isNearCancel: boolean) => void;
  disabled?: boolean;
}

export function MicrophoneButton({
  isRecording,
  onStartRecording,
  onStopRecording,
  onCancelRecording,
  onSlideCancel,
  disabled,
}: MicrophoneButtonProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const panX = useRef(new Animated.Value(0)).current;
  const pressStartTimeRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const isCancelledRef = useRef<boolean>(false);

  // Pulse animation when recording
  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (isRecording) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.18,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    } else {
      pulseAnim.setValue(1);
      panX.setValue(0);
    }

    return () => {
      animation?.stop();
    };
  }, [isRecording, pulseAnim, panX]);

  // WhatsApp-style hold and slide-to-cancel PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return !disabled && Math.abs(gestureState.dx) > 6;
      },
      onPanResponderGrant: () => {
        if (disabled) return;
        pressStartTimeRef.current = Date.now();
        isDraggingRef.current = true;
        isCancelledRef.current = false;
        panX.setValue(0);

        if (!isRecording) {
          onStartRecording?.();
        }
      },
      onPanResponderMove: (_, gestureState) => {
        if (!isDraggingRef.current) return;
        // Only allow sliding to the left
        const dx = Math.min(0, Math.max(-130, gestureState.dx));
        panX.setValue(dx);

        const nearCancel = dx < -65;
        if (nearCancel !== isCancelledRef.current) {
          isCancelledRef.current = nearCancel;
          onSlideCancel?.(nearCancel);
        }
      },
      onPanResponderRelease: () => {
        const holdDuration = Date.now() - pressStartTimeRef.current;
        isDraggingRef.current = false;
        Animated.spring(panX, { toValue: 0, useNativeDriver: true, speed: 20 }).start();

        if (isCancelledRef.current) {
          isCancelledRef.current = false;
          onSlideCancel?.(false);
          onCancelRecording?.();
        } else if (isRecording) {
          // If already recording and tapped again, stop and send
          onStopRecording?.();
        } else if (holdDuration >= 350) {
          // Held down and released: stop and send immediately
          onStopRecording?.();
        } else {
          // Short tap: starts recording (keep it recording until Done is pressed)
        }
      },
      onPanResponderTerminate: () => {
        isDraggingRef.current = false;
        Animated.spring(panX, { toValue: 0, useNativeDriver: true, speed: 20 }).start();
        if (isCancelledRef.current) {
          isCancelledRef.current = false;
          onSlideCancel?.(false);
          onCancelRecording?.();
        } else {
          onStopRecording?.();
        }
      },
    })
  ).current;

  return (
    <Animated.View
      style={{
        transform: [{ scale: pulseAnim }, { translateX: panX }],
      }}
      {...panResponder.panHandlers}
    >
      <View
        style={[
          styles.button,
          isRecording ? styles.buttonRecording : styles.buttonIdle,
          disabled && styles.buttonDisabled,
        ]}
        accessibilityLabel={isRecording ? 'Release to send, slide left to cancel' : 'Hold to speak'}
      >
        {isRecording ? (
          <View style={styles.recordingCenterIcon}>
            <MicIcon size={18} color="#FFFFFF" />
          </View>
        ) : (
          <MicIcon size={17} color={disabled ? THEME.colors.textDisabled : THEME.colors.accent} />
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIdle: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  buttonRecording: {
    backgroundColor: THEME.colors.danger,
    shadowColor: THEME.colors.danger,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.65,
    shadowRadius: 7,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.4,
    borderColor: THEME.colors.borderSubtle,
    backgroundColor: 'transparent',
  },
  recordingCenterIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
