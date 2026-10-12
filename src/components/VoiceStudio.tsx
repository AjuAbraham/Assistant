import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Switch,
} from 'react-native';
import { THEME } from '../theme/tokens';
import { KOKORO_VOICES, TTS_SPEED_OPTIONS, KokoroVoiceMetadata } from '../constants/tts';
import { ModelState } from '../types';
import { PlayIcon, StopIcon } from './common/Icons';

interface VoiceStudioProps {
  selectedVoiceId: string;
  onSelectVoice: (voiceId: string) => void;
  speechSpeed: number;
  onSelectSpeed: (speed: number) => void;
  autoPlay: boolean;
  onToggleAutoPlay: (val: boolean) => void;
  ttsModelState: ModelState;
  onDownloadModel: () => void;
  onDeleteModel: () => void;
  previewingVoiceId: string | null;
  isPreviewSynthesizing: boolean;
  onPreviewVoice: (voice: KokoroVoiceMetadata) => void;
  onStopPreview: () => void;
}

export function VoiceStudio({
  selectedVoiceId,
  onSelectVoice,
  speechSpeed,
  onSelectSpeed,
  autoPlay,
  onToggleAutoPlay,
  ttsModelState,
  onDownloadModel,
  onDeleteModel,
  previewingVoiceId,
  isPreviewSynthesizing,
  onPreviewVoice,
  onStopPreview,
}: VoiceStudioProps) {
  const isModelReady = ttsModelState.status === 'downloaded';
  const isDownloading = ttsModelState.status === 'downloading';

  return (
    <View style={styles.container}>
      {/* 1. MODEL ASSET & ENGINE STATUS CARD */}
      <Text style={styles.sectionHeaderTitle}>KOKORO-82M TTS RUNTIME</Text>
      <View style={styles.card}>
        <View style={styles.modelHeaderRow}>
          <View style={styles.modelIconBadge}>
            <Text style={styles.modelIconGlyph}>🗣️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.modelTitleRow}>
              <Text style={styles.modelTitle}>Kokoro-82M Offline Voice Engine</Text>
              <View
                style={[
                  styles.statusBadge,
                  isModelReady ? styles.statusBadgeReady : styles.statusBadgePending,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    isModelReady ? styles.statusBadgeTextReady : styles.statusBadgeTextPending,
                  ]}
                >
                  {isModelReady ? 'Ready' : isDownloading ? 'Downloading' : 'Required'}
                </Text>
              </View>
            </View>
            <Text style={styles.modelDesc}>
              High-naturalness local speech synthesis using Kokoro-82M StyleTTS. Runs 100% on-device.
            </Text>
          </View>
        </View>

        {/* Download / Storage Controls */}
        {isDownloading ? (
          <View style={styles.downloadProgressBlock}>
            <View style={styles.progressInfoRow}>
              <Text style={styles.progressLabelText}>Downloading Kokoro assets...</Text>
              <Text style={styles.progressPctText}>{ttsModelState.progress}%</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View
                style={[styles.progressBarFill, { width: `${Math.max(5, ttsModelState.progress)}%` }]}
              />
            </View>
            <Text style={styles.progressMetaText}>
              {ttsModelState.writtenMB.toFixed(1)} MB / {ttsModelState.totalMB} MB
            </Text>
          </View>
        ) : isModelReady ? (
          <View style={styles.modelReadyRow}>
            <Text style={styles.modelReadyMetaText}>
              ✓ Model weights & voicepacks verified (~{ttsModelState.totalMB} MB)
            </Text>
            <TouchableOpacity onPress={onDeleteModel} activeOpacity={0.7} style={styles.deleteLink}>
              <Text style={styles.deleteLinkText}>Delete weights</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.downloadBtn}
            onPress={onDownloadModel}
            activeOpacity={0.8}
          >
            <Text style={styles.downloadBtnText}>
              Download Kokoro TTS Model (~{ttsModelState.totalMB} MB)
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 2. SPEECH SPEED CONTROL */}
      <Text style={styles.sectionHeaderTitle}>SPEECH SPEED</Text>
      <View style={styles.card}>
        <View style={styles.settingLabelRow}>
          <Text style={styles.settingLabelTitle}>Pacing & Cadence</Text>
          <Text style={styles.settingCurrentVal}>{speechSpeed.toFixed(2)}x</Text>
        </View>
        <Text style={styles.settingDescText}>
          Fine-tune assistant speaking pace. Defaults to 1.00x.
        </Text>
        <View style={styles.pillsRow}>
          {TTS_SPEED_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.val}
              style={[styles.pillBtn, speechSpeed === opt.val && styles.pillBtnActive]}
              onPress={() => onSelectSpeed(opt.val)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.pillBtnText,
                  speechSpeed === opt.val && styles.pillBtnTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 3. AUTO-PLAY TOGGLE */}
      <Text style={styles.sectionHeaderTitle}>ASSISTANT AUDIO BEHAVIOR</Text>
      <View style={styles.card}>
        <View style={styles.toggleRow}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.settingLabelTitle}>Auto-Play Replies</Text>
            <Text style={styles.settingDescText}>
              Automatically speak assistant replies aloud as soon as generation completes.
            </Text>
          </View>
          <Switch
            value={autoPlay}
            onValueChange={onToggleAutoPlay}
            trackColor={{ false: THEME.colors.bgSurface, true: 'rgba(56, 189, 248, 0.4)' }}
            thumbColor={autoPlay ? THEME.colors.accent : THEME.colors.textTertiary}
          />
        </View>
      </View>

      {/* 4. VOICE STUDIO VOICES LIST */}
      <View style={styles.voiceSectionHeaderRow}>
        <Text style={styles.sectionHeaderTitle}>VOICE STUDIO LIBRARY</Text>
        <Text style={styles.voiceCountBadge}>{KOKORO_VOICES.length} available</Text>
      </View>

      {!isModelReady && (
        <View style={styles.noticeBanner}>
          <Text style={styles.noticeBannerText}>
            ℹ️ Download the Kokoro TTS model above to enable on-device voice preview and message synthesis.
          </Text>
        </View>
      )}

      <View style={styles.voicesList}>
        {KOKORO_VOICES.map((v) => {
          const isSelected = selectedVoiceId === v.id;
          const isThisPreviewing = previewingVoiceId === v.id;

          return (
            <TouchableOpacity
              key={v.id}
              style={[
                styles.voiceCard,
                isSelected && styles.voiceCardSelected,
                !isModelReady && styles.voiceCardDisabled,
              ]}
              onPress={() => {
                if (isModelReady) {
                  onSelectVoice(v.id);
                }
              }}
              activeOpacity={0.8}
            >
              {/* Radio Indicator */}
              <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                {isSelected && <View style={styles.radioInner} />}
              </View>

              {/* Voice Info */}
              <View style={styles.voiceInfoGroup}>
                <View style={styles.voiceNameRow}>
                  <Text style={[styles.voiceName, isSelected && styles.voiceNameSelected]}>
                    {v.name}
                  </Text>
                  {v.id === 'af_nicole' && (
                    <View style={styles.defaultPill}>
                      <Text style={styles.defaultPillText}>Default</Text>
                    </View>
                  )}
                  <View style={styles.accentBadge}>
                    <Text style={styles.accentBadgeText}>{v.accent}</Text>
                  </View>
                  <View style={styles.genderBadge}>
                    <Text style={styles.genderBadgeText}>{v.gender}</Text>
                  </View>
                </View>

                <Text style={styles.voiceTraits} numberOfLines={2}>
                  {v.traits}
                </Text>

                <Text style={styles.voiceGrade}>Quality: {v.qualityGrade}</Text>
              </View>

              {/* Genuine On-Device Preview Button */}
              <TouchableOpacity
                style={[
                  styles.previewBtn,
                  isThisPreviewing && styles.previewBtnActive,
                  !isModelReady && styles.previewBtnDisabled,
                ]}
                disabled={!isModelReady}
                onPress={() => {
                  if (isThisPreviewing) {
                    onStopPreview();
                  } else {
                    onPreviewVoice(v);
                  }
                }}
                activeOpacity={0.7}
              >
                {isThisPreviewing && isPreviewSynthesizing ? (
                  <ActivityIndicator size="small" color={THEME.colors.accent} />
                ) : isThisPreviewing ? (
                  <View style={styles.previewBtnInner}>
                    <StopIcon size={11} color="#EF4444" />
                    <Text style={[styles.previewBtnText, styles.previewBtnTextStop]}>Stop</Text>
                  </View>
                ) : (
                  <View style={styles.previewBtnInner}>
                    <PlayIcon size={10} color={isSelected ? THEME.colors.accent : THEME.colors.textSecondary} />
                    <Text style={[styles.previewBtnText, isSelected && styles.previewBtnTextActive]}>
                      Preview
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: THEME.spacing.md,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textSecondary,
    letterSpacing: 1,
    marginBottom: THEME.spacing.sm,
    paddingLeft: 2,
  },
  card: {
    backgroundColor: THEME.colors.bgCard,
    borderRadius: THEME.radii.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.xl,
    borderWidth: 1,
    borderColor: THEME.colors.borderSubtle,
  },
  modelHeaderRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  modelIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modelIconGlyph: {
    fontSize: 18,
  },
  modelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  modelTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  modelDesc: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    lineHeight: 17,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radii.full,
  },
  statusBadgeReady: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusBadgePending: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statusBadgeTextReady: {
    color: '#10B981',
  },
  statusBadgeTextPending: {
    color: '#F59E0B',
  },
  downloadProgressBlock: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.borderSubtle,
  },
  progressInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabelText: {
    fontSize: 12,
    color: THEME.colors.textPrimary,
    fontWeight: '600',
  },
  progressPctText: {
    fontSize: 12,
    color: THEME.colors.accent,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: THEME.colors.bgSurface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: THEME.colors.accent,
  },
  progressMetaText: {
    fontSize: 11,
    color: THEME.colors.textTertiary,
    marginTop: 4,
  },
  modelReadyRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.borderSubtle,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modelReadyMetaText: {
    fontSize: 11.5,
    color: '#10B981',
    fontWeight: '600',
  },
  deleteLink: {
    paddingVertical: 2,
  },
  deleteLinkText: {
    color: THEME.colors.danger,
    fontSize: 11,
    fontWeight: '600',
  },
  downloadBtn: {
    marginTop: 14,
    backgroundColor: THEME.colors.accent,
    borderRadius: THEME.radii.md,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadBtnText: {
    color: '#040711',
    fontSize: 13,
    fontWeight: '700',
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
    marginTop: 3,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  voiceSectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  voiceCountBadge: {
    fontSize: 11,
    color: THEME.colors.textTertiary,
    fontWeight: '600',
  },
  noticeBanner: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    borderRadius: THEME.radii.md,
    padding: 10,
    marginBottom: 12,
  },
  noticeBannerText: {
    fontSize: 11.5,
    color: THEME.colors.textSecondary,
    lineHeight: 16,
  },
  voicesList: {
    gap: 8,
    marginBottom: THEME.spacing.xl,
  },
  voiceCard: {
    backgroundColor: THEME.colors.bgCard,
    borderRadius: THEME.radii.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.colors.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  voiceCardSelected: {
    borderColor: THEME.colors.accent,
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
  },
  voiceCardDisabled: {
    opacity: 0.7,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: THEME.colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: THEME.colors.accent,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.colors.accent,
  },
  voiceInfoGroup: {
    flex: 1,
    gap: 2,
  },
  voiceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  voiceName: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  voiceNameSelected: {
    color: THEME.colors.accent,
  },
  defaultPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  defaultPillText: {
    fontSize: 9.5,
    color: THEME.colors.accent,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  accentBadge: {
    backgroundColor: THEME.colors.bgSurface,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  accentBadgeText: {
    fontSize: 9.5,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
  genderBadge: {
    backgroundColor: THEME.colors.bgSurface,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  genderBadgeText: {
    fontSize: 9.5,
    color: THEME.colors.textTertiary,
    fontWeight: '600',
  },
  voiceTraits: {
    fontSize: 11.5,
    color: THEME.colors.textSecondary,
    lineHeight: 15,
  },
  voiceGrade: {
    fontSize: 10,
    color: THEME.colors.textTertiary,
    fontWeight: '600',
    marginTop: 1,
  },
  previewBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: THEME.radii.sm,
    backgroundColor: THEME.colors.bgSurface,
    borderWidth: 1,
    borderColor: THEME.colors.borderSubtle,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBtnActive: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  previewBtnDisabled: {
    opacity: 0.4,
  },
  previewBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  previewBtnTextActive: {
    color: THEME.colors.accent,
  },
  previewBtnTextStop: {
    color: '#EF4444',
  },
});
