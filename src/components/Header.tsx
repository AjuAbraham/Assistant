import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { theme } from '../theme/tokens';
import { LLMConfig, ModelStatus } from '../types';

interface HeaderProps {
  activeTab: string;
  selectedModel: LLMConfig;
  modelStatus: ModelStatus;
  isReady: boolean;
  onNewChat?: () => void;
  onOpenModels?: () => void;
  hasMessages?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  selectedModel,
  modelStatus,
  isReady,
  onNewChat,
  onOpenModels,
  hasMessages,
}) => {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.brandRow}>
        <View style={styles.brandLeft}>
          <View style={[styles.statusGlowRing, isReady ? styles.glowRingReady : styles.glowRingIdle]}>
            <View style={[styles.statusDot, isReady ? styles.dotReady : styles.dotIdle]} />
          </View>
          <View>
            <Text style={styles.brandTitle}>VERESA</Text>
            <Text style={styles.brandSubtitle}>
              {isReady ? `Offline • ${selectedModel.name.split(' ')[0]} ${selectedModel.tag}` : 'Offline AI Assistant'}
            </Text>
          </View>
        </View>

        <View style={styles.actionsRight}>
          {/* Quick Model Pill */}
          <TouchableOpacity
            style={[styles.modelStatusPill, isReady ? styles.pillReady : styles.pillIdle]}
            onPress={onOpenModels}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, isReady ? styles.pillTextReady : styles.pillTextIdle]}>
              {isReady ? '● RAM ACTIVE' : modelStatus === 'loading' ? '⏳ LOADING' : modelStatus === 'downloading' ? '📥 DOWNLOADING' : '⚙️ MODELS'}
            </Text>
          </TouchableOpacity>

          {/* New Chat Button (Only on assistant tab when messages exist) */}
          {activeTab === 'assistant' && hasMessages && onNewChat && (
            <TouchableOpacity style={styles.newChatBtn} onPress={onNewChat} activeOpacity={0.7}>
              <Text style={styles.newChatBtnText}>+ New</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusGlowRing: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRingReady: {
    backgroundColor: theme.colors.successGlow,
  },
  glowRingIdle: {
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotReady: {
    backgroundColor: theme.colors.success,
  },
  dotIdle: {
    backgroundColor: theme.colors.textSecondary,
  },
  brandTitle: {
    ...theme.typography.titleMedium,
    letterSpacing: 1.2,
  },
  brandSubtitle: {
    ...theme.typography.caption,
    marginTop: 1,
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modelStatusPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
  },
  pillReady: {
    backgroundColor: theme.colors.successGlow,
    borderColor: 'rgba(74, 222, 128, 0.4)',
  },
  pillIdle: {
    backgroundColor: theme.colors.bgCard,
    borderColor: theme.colors.borderSubtle,
  },
  pillText: {
    ...theme.typography.pill,
  },
  pillTextReady: {
    color: theme.colors.success,
  },
  pillTextIdle: {
    color: theme.colors.textSecondary,
  },
  newChatBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radii.sm,
  },
  newChatBtnText: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: '700',
  },
});
