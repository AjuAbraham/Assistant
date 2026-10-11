import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { THEME } from '../theme/tokens';
import { LLMConfig, ModelState, NavigationTab } from '../types';

interface HeaderProps {
  selectedModel: LLMConfig;
  activeState: ModelState;
  isModelReady: boolean;
  activeTab: NavigationTab;
  hasMessages: boolean;
  onOpenModels: () => void;
  onClearChat: () => void;
}

export function Header({
  selectedModel,
  activeState,
  isModelReady,
  activeTab,
  hasMessages,
  onOpenModels,
  onClearChat,
}: HeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerBrandRow}>
        <View style={styles.brandLeft}>
          <View style={[styles.statusRing, isModelReady ? styles.statusRingReady : styles.statusRingIdle]}>
            <View style={[styles.statusDot, isModelReady ? styles.statusDotReady : styles.statusDotIdle]} />
          </View>
          <View>
            <Text style={styles.brandTitle}>VERESA</Text>
            <Text style={styles.brandSubtitle}>
              {isModelReady
                ? `Offline • ${selectedModel.name.split(' ')[0]} ${selectedModel.tag}`
                : 'Private Offline AI'}
            </Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          {/* Quick Model Pill */}
          <TouchableOpacity
            style={[styles.modelPill, isModelReady ? styles.modelPillReady : styles.modelPillIdle]}
            onPress={onOpenModels}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.modelPillText,
                isModelReady ? styles.modelPillTextReady : styles.modelPillTextIdle,
              ]}
            >
              {isModelReady
                ? '● RAM ACTIVE'
                : activeState.status === 'loading'
                ? '⏳ LOADING'
                : activeState.status === 'downloading'
                ? '📥 DOWNLOADING'
                : '⚙️ MODELS'}
            </Text>
          </TouchableOpacity>

          {/* Clear / New Chat button */}
          {activeTab === 'assistant' && hasMessages && (
            <TouchableOpacity style={styles.newChatBtn} onPress={onClearChat} activeOpacity={0.75}>
              <Text style={styles.newChatBtnPlus}>+</Text>
              <Text style={styles.newChatBtnText}>New</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.sm,
    paddingBottom: THEME.spacing.md,
    backgroundColor: THEME.colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.borderSubtle,
  },
  headerBrandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusRing: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRingReady: {
    backgroundColor: THEME.colors.successGlow,
  },
  statusRingIdle: {
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotReady: {
    backgroundColor: THEME.colors.success,
  },
  statusDotIdle: {
    backgroundColor: THEME.colors.textSecondary,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    letterSpacing: 1.2,
  },
  brandSubtitle: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modelPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: THEME.radii.sm,
    borderWidth: 1,
  },
  modelPillReady: {
    backgroundColor: THEME.colors.successGlow,
    borderColor: 'rgba(74, 222, 128, 0.4)',
  },
  modelPillIdle: {
    backgroundColor: THEME.colors.bgCard,
    borderColor: THEME.colors.borderSubtle,
  },
  modelPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  modelPillTextReady: {
    color: THEME.colors.success,
  },
  modelPillTextIdle: {
    color: THEME.colors.textSecondary,
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: THEME.radii.full,
  },
  newChatBtnPlus: {
    color: THEME.colors.accent,
    fontSize: 13,
    fontWeight: '800',
    marginTop: -1,
  },
  newChatBtnText: {
    color: THEME.colors.accent,
    fontSize: 11.5,
    fontWeight: '700',
  },
});
