import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { THEME } from '../../theme/tokens';

export function TypingDots({ label }: { label?: string } = {}) {
  const a = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(a, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [a]);

  const opacityFor = (phase: number) =>
    a.interpolate({
      inputRange: [0, 0.33, 0.66, 1],
      outputRange:
        phase === 0
          ? [0.25, 1, 0.25, 0.25]
          : phase === 1
          ? [0.25, 0.25, 1, 0.25]
          : [0.25, 0.25, 0.25, 1],
    });

  return (
    <View style={styles.container}>
      <View style={styles.dotsRow}>
        {[0, 1, 2].map((i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                opacity: opacityFor(i),
              },
            ]}
          />
        ))}
      </View>
      {label ? (
        <Text style={styles.label}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 4,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.textSecondary,
  },
  label: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    fontStyle: 'italic',
  },
});
