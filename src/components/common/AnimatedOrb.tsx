import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { THEME } from '../../theme/tokens';

export const AnimatedOrb = ({ isReady }: { isReady: boolean }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
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
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  return (
    <View style={orbStyles.container}>
      <Animated.View
        style={[
          orbStyles.outerRing,
          isReady ? orbStyles.outerReady : orbStyles.outerIdle,
          { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <View style={[orbStyles.middleRing, isReady ? orbStyles.middleReady : orbStyles.middleIdle]}>
          <View style={[orbStyles.innerCore, isReady ? orbStyles.coreReady : orbStyles.coreIdle]} />
        </View>
      </Animated.View>
    </View>
  );
};

const orbStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: THEME.spacing.md,
  },
  outerRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
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
    width: 50,
    height: 50,
    borderRadius: 25,
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
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  coreReady: {
    backgroundColor: THEME.colors.accent,
    elevation: 6,
  },
  coreIdle: {
    backgroundColor: THEME.colors.textSecondary,
  },
});
