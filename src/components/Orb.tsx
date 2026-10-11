import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { theme } from '../theme/tokens';

interface OrbProps {
  isReady?: boolean;
}

export const Orb: React.FC<OrbProps> = ({ isReady = false }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Subtle breathing pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.outerRing,
          isReady ? styles.outerReady : styles.outerIdle,
          { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <View style={[styles.middleRing, isReady ? styles.middleReady : styles.middleIdle]}>
          <View style={[styles.innerCore, isReady ? styles.coreReady : styles.coreIdle]} />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.spacing.lg,
  },
  outerRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  outerReady: {
    borderColor: 'rgba(56, 189, 248, 0.3)',
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
  },
  outerIdle: {
    borderColor: 'rgba(100, 116, 139, 0.2)',
    backgroundColor: 'rgba(100, 116, 139, 0.05)',
  },
  middleRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  middleReady: {
    borderColor: 'rgba(56, 189, 248, 0.6)',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  middleIdle: {
    borderColor: 'rgba(100, 116, 139, 0.4)',
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
  },
  innerCore: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  coreReady: {
    backgroundColor: theme.colors.accent,
    shadowColor: theme.colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 6,
  },
  coreIdle: {
    backgroundColor: theme.colors.textSecondary,
  },
});
