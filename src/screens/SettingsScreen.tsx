import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { theme } from '../theme/tokens';

interface SettingsScreenProps {
  temperature: number;
  onSetTemperature: (val: number) => void;
  maxTokens: number;
  onSetMaxTokens: (val: number) => void;
  systemPrompt: string;
  onSetSystemPrompt: (prompt: string) => void;
  onResetSystemPrompt: () => void;
  activeModelName?: string;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  temperature,
  onSetTemperature,
  maxTokens,
  onSetMaxTokens,
  systemPrompt,
  onSetSystemPrompt,
  onResetSystemPrompt,
  activeModelName,
}) => {
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Section 1: Generation & Inference */}
        <Text style={styles.sectionHeader}>INFERENCE PARAMETERS</Text>
        <View style={styles.card}>
          {/* Temperature Setting */}
          <View style={styles.settingItem}>
            <View style={styles.settingTextRow}>
              <Text style={styles.settingTitle}>Temperature</Text>
              <Text style={styles.settingCurrentVal}>{temperature}</Text>
            </View>
            <Text style={styles.settingDesc}>
              Controls creativity. Lower values are more factual and deterministic; higher values are more expressive.
            </Text>
            <View style={styles.optionsRow}>
              {[
                { val: 0.2, label: '0.2 (Precise)' },
                { val: 0.7, label: '0.7 (Balanced)' },
                { val: 1.0, label: '1.0 (Creative)' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.val}
                  style={[styles.optionPill, temperature === opt.val && styles.optionPillActive]}
                  onPress={() => onSetTemperature(opt.val)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionText, temperature === opt.val && styles.optionTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Max Tokens Setting */}
          <View style={styles.settingItem}>
            <View style={styles.settingTextRow}>
              <Text style={styles.settingTitle}>Max Response Tokens</Text>
              <Text style={styles.settingCurrentVal}>{maxTokens}</Text>
            </View>
            <Text style={styles.settingDesc}>Maximum token length limit generated per assistant reply.</Text>
            <View style={styles.optionsRow}>
              {[
                { val: 256, label: '256 tokens' },
                { val: 512, label: '512 tokens' },
                { val: 1024, label: '1024 tokens' },
                { val: 1536, label: '1536 tokens' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.val}
                  style={[styles.optionPill, maxTokens === opt.val && styles.optionPillActive]}
                  onPress={() => onSetMaxTokens(opt.val)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionText, maxTokens === opt.val && styles.optionTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Section 2: Assistant System Prompt */}
        <Text style={styles.sectionHeader}>ASSISTANT PERSONALITY & SYSTEM PROMPT</Text>
        <View style={styles.card}>
          <View style={styles.promptHeaderRow}>
            <Text style={styles.settingTitle}>System Prompt</Text>
            <TouchableOpacity onPress={onResetSystemPrompt} activeOpacity={0.7}>
              <Text style={styles.resetLink}>Reset to Default</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.systemPromptInput}
            value={systemPrompt}
            onChangeText={onSetSystemPrompt}
            multiline
            numberOfLines={4}
            placeholder="Enter system prompt instructions for Veresa..."
            placeholderTextColor={theme.colors.textTertiary}
          />
        </View>

        {/* Section 3: Privacy & Architecture */}
        <Text style={styles.sectionHeader}>PRIVACY & SECURITY</Text>
        <View style={styles.card}>
          <View style={styles.privacyRow}>
            <Text style={styles.privacyIcon}>🔒</Text>
            <View style={styles.privacyTextGroup}>
              <Text style={styles.privacyTitle}>100% On-Device Local AI</Text>
              <Text style={styles.privacyBody}>
                All conversations and model weights live strictly on your device. Veresa sends zero prompts, transcripts, or telemetry to external servers.
              </Text>
            </View>
          </View>
        </View>

        {/* Section 4: System Information */}
        <Text style={styles.sectionHeader}>ABOUT VERESA</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App Version</Text>
            <Text style={styles.infoValue}>1.0.0 (Production Build)</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Inference Runtime</Text>
            <Text style={styles.infoValue}>llama.cpp (ARM64 v8a Native)</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Active Model</Text>
            <Text style={[styles.infoValue, activeModelName ? styles.textAccent : styles.textMuted]}>
              {activeModelName || 'None loaded in RAM'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgApp,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 40,
  },
  sectionHeader: {
    ...theme.typography.sectionHeader,
    marginBottom: theme.spacing.sm,
    paddingLeft: 2,
  },
  card: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  settingItem: {
    gap: 8,
  },
  settingTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingTitle: {
    ...theme.typography.titleMedium,
    fontSize: 14,
  },
  settingCurrentVal: {
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: '800',
  },
  settingDesc: {
    ...theme.typography.bodySmall,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  optionPill: {
    flex: 1,
    backgroundColor: theme.colors.bgApp,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.sm,
    paddingVertical: 8,
    alignItems: 'center',
  },
  optionPillActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: theme.colors.accent,
  },
  optionText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  optionTextActive: {
    color: theme.colors.accent,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderSubtle,
    marginVertical: 14,
  },
  promptHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resetLink: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: '600',
  },
  systemPromptInput: {
    backgroundColor: theme.colors.bgApp,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    padding: 12,
    color: theme.colors.textPrimary,
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
  privacyIcon: {
    fontSize: 22,
    marginTop: 2,
  },
  privacyTextGroup: {
    flex: 1,
  },
  privacyTitle: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  privacyBody: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  infoValue: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  textAccent: {
    color: theme.colors.accent,
  },
  textMuted: {
    color: theme.colors.textTertiary,
  },
});
