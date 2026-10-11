import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { THEME } from '../theme/tokens';
import { LLMConfig } from '../types';

interface SettingsScreenProps {
  temperature: number;
  onSetTemperature: (val: number) => void;
  maxTokens: number;
  onSetMaxTokens: (val: number) => void;
  systemPrompt: string;
  onSetSystemPrompt: (val: string) => void;
  onResetSystemPrompt: () => void;
  isModelReady: boolean;
  selectedModel: LLMConfig;
}

export function SettingsScreen({
  temperature,
  onSetTemperature,
  maxTokens,
  onSetMaxTokens,
  systemPrompt,
  onSetSystemPrompt,
  onResetSystemPrompt,
  isModelReady,
  selectedModel,
}: SettingsScreenProps) {
  return (
    <View style={styles.tabContentContainer}>
      <ScrollView contentContainerStyle={styles.settingsScrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeaderTitle}>INFERENCE PARAMETERS</Text>
        <View style={styles.settingsCard}>
          {/* Temperature */}
          <View style={styles.settingRowItem}>
            <View style={styles.settingLabelRow}>
              <Text style={styles.settingLabelTitle}>Temperature</Text>
              <Text style={styles.settingCurrentVal}>{temperature}</Text>
            </View>
            <Text style={styles.settingDescText}>
              Controls creativity. Lower values produce deterministic output; higher values allow expressive phrasing.
            </Text>
            <View style={styles.pillsRow}>
              {[
                { val: 0.2, label: '0.2 (Precise)' },
                { val: 0.7, label: '0.7 (Balanced)' },
                { val: 1.0, label: '1.0 (Creative)' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.val}
                  style={[styles.pillBtn, temperature === opt.val && styles.pillBtnActive]}
                  onPress={() => onSetTemperature(opt.val)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.pillBtnText,
                      temperature === opt.val && styles.pillBtnTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.settingsDivider} />

          {/* Max Tokens */}
          <View style={styles.settingRowItem}>
            <View style={styles.settingLabelRow}>
              <Text style={styles.settingLabelTitle}>Max Response Tokens</Text>
              <Text style={styles.settingCurrentVal}>{maxTokens}</Text>
            </View>
            <Text style={styles.settingDescText}>Maximum output tokens generated per reply.</Text>
            <View style={styles.pillsRow}>
              {[
                { val: 256, label: '256 tokens' },
                { val: 512, label: '512 tokens' },
                { val: 1024, label: '1024 tokens' },
                { val: 1536, label: '1536 tokens' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.val}
                  style={[styles.pillBtn, maxTokens === opt.val && styles.pillBtnActive]}
                  onPress={() => onSetMaxTokens(opt.val)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.pillBtnText,
                      maxTokens === opt.val && styles.pillBtnTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.sectionHeaderTitle}>PERSONALITY & SYSTEM PROMPT</Text>
        <View style={styles.settingsCard}>
          <View style={styles.promptHeaderRow}>
            <Text style={styles.settingLabelTitle}>System Instructions</Text>
            <TouchableOpacity onPress={onResetSystemPrompt} activeOpacity={0.7}>
              <Text style={styles.resetPromptLink}>Reset</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.systemPromptInput}
            value={systemPrompt}
            onChangeText={onSetSystemPrompt}
            multiline
            numberOfLines={4}
            placeholder="Enter system prompt instructions for Veresa..."
            placeholderTextColor={THEME.colors.textTertiary}
          />
        </View>

        <Text style={styles.sectionHeaderTitle}>PRIVACY & SYSTEM DIAGNOSTICS</Text>
        <View style={styles.settingsCard}>
          <View style={styles.privacyRow}>
            <Text style={styles.privacyIconText}>🔒</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.privacyHeading}>100% On-Device Local AI</Text>
              <Text style={styles.privacyBodyText}>
                Conversations stay strictly on your phone. No telemetry, prompts, or audio ever leave your device.
              </Text>
            </View>
          </View>

          <View style={styles.settingsDivider} />

          <View style={styles.diagRow}>
            <Text style={styles.diagLabel}>App Version</Text>
            <Text style={styles.diagVal}>1.0.0 (Production)</Text>
          </View>
          <View style={styles.diagRow}>
            <Text style={styles.diagLabel}>Inference Runtime</Text>
            <Text style={styles.diagVal}>llama.cpp ARM64</Text>
          </View>
          <View style={styles.diagRow}>
            <Text style={styles.diagLabel}>Active Model</Text>
            <Text style={[styles.diagVal, isModelReady ? styles.valAccent : styles.valMuted]}>
              {isModelReady ? selectedModel.name : 'None loaded in RAM'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabContentContainer: {
    flex: 1,
  },
  settingsScrollContent: {
    padding: THEME.spacing.lg,
    paddingBottom: 40,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textSecondary,
    letterSpacing: 1,
    marginBottom: THEME.spacing.sm,
    paddingLeft: 2,
  },
  settingsCard: {
    backgroundColor: THEME.colors.bgCard,
    borderRadius: THEME.radii.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.xl,
    borderWidth: 1,
    borderColor: THEME.colors.borderSubtle,
  },
  settingRowItem: {
    gap: 8,
  },
  settingLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabelTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  settingCurrentVal: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.accent,
  },
  settingDescText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    lineHeight: 17,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  pillBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: THEME.radii.sm,
    backgroundColor: THEME.colors.bgSurface,
    borderWidth: 1,
    borderColor: THEME.colors.borderSubtle,
  },
  pillBtnActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: THEME.colors.accent,
  },
  pillBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  pillBtnTextActive: {
    color: THEME.colors.accent,
    fontWeight: '700',
  },
  settingsDivider: {
    height: 1,
    backgroundColor: THEME.colors.borderSubtle,
    marginVertical: THEME.spacing.lg,
  },
  promptHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  resetPromptLink: {
    color: THEME.colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  systemPromptInput: {
    backgroundColor: THEME.colors.bgSurface,
    borderRadius: THEME.radii.md,
    borderWidth: 1,
    borderColor: THEME.colors.borderSubtle,
    padding: 12,
    color: THEME.colors.textPrimary,
    fontSize: 13,
    lineHeight: 19,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  privacyRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  privacyIconText: {
    fontSize: 22,
    marginTop: 2,
  },
  privacyHeading: {
    color: THEME.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  privacyBodyText: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  diagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 3,
  },
  diagLabel: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
  },
  diagVal: {
    color: THEME.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  valAccent: {
    color: THEME.colors.accent,
  },
  valMuted: {
    color: THEME.colors.textSecondary,
  },
});
