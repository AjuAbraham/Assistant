import React from 'react';
import { View, Text } from 'react-native';

export function CopyIcon({ size = 11, color = '#8B949E' }: { size?: number; color?: string }) {
  const outer = size;
  const inner = Math.round(size * 0.72);
  const offset = Math.round(size * 0.25);
  return (
    <View style={{ width: outer, height: outer }}>
      {/* Background overlapping page */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: inner,
          height: inner,
          borderRadius: 2,
          borderWidth: 1.1,
          borderColor: color,
          opacity: 0.45,
        }}
      />
      {/* Foreground primary page */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: inner,
          height: inner,
          borderRadius: 2,
          borderWidth: 1.1,
          borderColor: color,
          backgroundColor: '#0D1117',
        }}
      />
    </View>
  );
}

export function CheckIcon({ size = 11, color = '#10B981' }: { size?: number; color?: string }) {
  return (
    <Text style={{ fontSize: size, color, fontWeight: '900', lineHeight: size + 2 }}>✓</Text>
  );
}
