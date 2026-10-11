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

export function MicIcon({ size = 16, color = '#38BDF8' }: { size?: number; color?: string }) {
  const capsuleWidth = Math.round(size * 0.42);
  const capsuleHeight = Math.round(size * 0.62);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Mic capsule */}
      <View
        style={{
          width: capsuleWidth,
          height: capsuleHeight,
          borderRadius: capsuleWidth / 2,
          backgroundColor: color,
          marginTop: -2,
        }}
      />
      {/* Stand arc */}
      <View
        style={{
          position: 'absolute',
          top: Math.round(size * 0.2),
          width: Math.round(size * 0.72),
          height: Math.round(size * 0.48),
          borderBottomLeftRadius: Math.round(size * 0.36),
          borderBottomRightRadius: Math.round(size * 0.36),
          borderWidth: 1.6,
          borderTopWidth: 0,
          borderColor: color,
        }}
      />
      {/* Stand stem */}
      <View
        style={{
          position: 'absolute',
          bottom: 1.5,
          width: 1.6,
          height: Math.round(size * 0.2),
          backgroundColor: color,
        }}
      />
      {/* Stand base line */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          width: Math.round(size * 0.5),
          height: 1.6,
          backgroundColor: color,
          borderRadius: 1,
        }}
      />
    </View>
  );
}
