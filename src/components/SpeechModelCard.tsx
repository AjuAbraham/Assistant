import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { THEME } from '../theme/tokens';
import { ModelState } from '../types';
import { SPEECH_MODEL } from '../constants/speechModels';
import { MicIcon } from './common/Icons';

interface SpeechModelCardProps {
  state: ModelState;
  onDownload: () => void;
  onDelete: () => void;
}

export function SpeechModelCard({ state, onDownload, onDelete }: SpeechModelCardProps) {
  const isDownloading = state.status === 'downloading';
  const isDownloaded = state.status === 'downloaded' || state.status === 'ready';
  const isError = state.status === 'error';

  return (
    <View style={[styles.card, isDownloaded && styles.cardActive]}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View style={styles.iconCircle}>
            <MicIcon size={16} color={THEME.colors.accent} />
          </View>
          <View>
            <View style={styles.nameBadgeRow}>
              <Text style={styles.titleText}>{SPEECH_MODEL.name}</Text>
              <View style={styles.voiceBadge}>
                <Text style={styles.voiceBadgeText}>VOICE / STT</Text>
              </View>
            </View>
            <Text style={styles.engineText}>whisper.cpp JSI • CPU Offline</Text>
          </View>
        </View>

        <View
          style={[
            styles.statusBadge,
            isDownloaded
              ? styles.badgeDownloaded
              : isDownloading
              ? styles.badgeDownloading
              : styles.badgeIdle,
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              isDownloaded
                ? styles.textDownloaded
                : isDownloading
                ? styles.textDownloading
                : styles.textIdle,
            ]}
          >
            {isDownloaded ? '● READY' : isDownloading ? 'DOWNLOADING' : 'AVAILABLE'}
          </Text>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.descriptionText}>{SPEECH_MODEL.description}</Text>

      {/* Metadata Specs */}
      <View style={styles.specsRow}>
        <Text style={styles.specItem}>📦 ~{SPEECH_MODEL.sizeMB} MB</Text>
        <Text style={styles.specDot}>•</Text>
        <Text style={styles.specItem}>Whisper Tiny GGML</Text>
        <Text style={styles.specDot}>•</Text>
        <Text style={styles.specItem}>Zero Cloud</Text>
      </View>

      {/* Downloading Progress Bar */}
      {isDownloading && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${state.progress}%` }]} />
          </View>
          <View style={styles.progressMetaRow}>
            <Text style={styles.progressMetaText}>
              {state.writtenMB.toFixed(1)} / {state.totalMB} MB
            </Text>
            <Text style={styles.progressPercentText}>{state.progress}%</Text>
          </View>
        </View>
      )}

      {/* Error notification */}
      {isError && state.error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {state.error}</Text>
        </View>
      )}

      {/* Action Footer */}
      <View style={styles.footerRow}>
        {isDownloading ? (
          <View style={styles.downloadingPlaceholder}>
            <ActivityIndicator size="small" color={THEME.colors.accent} />
            <Text style={styles.downloadingLabel}>Downloading weights...</Text>
          </View>
        ) : isDownloaded ? (
          <View style={styles.downloadedActionsRow}>
            <View style={styles.readyIndicator}>
              <Text style={styles.readyIndicatorText}>✓ Ready for voice input</Text>
            </View>
            <TouchableOpacity style={styles.deleteButton} onPress={onDelete} activeOpacity={0.7}>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.downloadButton} onPress={onDownload} activeOpacity={0.8}>
            <Text style={styles.downloadButtonText}>Download Voice Model ({SPEECH_MODEL.sizeMB} MB)</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.bgSurface,
    borderRadius: THEME.radii.lg,
    padding: 16,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.borderSubtle,
  },
  cardActive: {
    borderColor: 'rgba(56, 189, 248, 0.35)',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  voiceBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: THEME.radii.full,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.35)',
  },
  voiceBadgeText: {
    color: '#C084FC',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  engineText: {
    fontSize: 11,
    color: THEME.colors.textTertiary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radii.full,
    borderWidth: 1,
  },
  badgeDownloaded: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  badgeDownloading: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  badgeIdle: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  textDownloaded: { color: THEME.colors.success },
  textDownloading: { color: THEME.colors.accent },
  textIdle: { color: THEME.colors.textTertiary },
  descriptionText: {
    fontSize: 12.5,
    lineHeight: 18,
    color: THEME.colors.textSecondary,
    marginBottom: 10,
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  specItem: {
    fontSize: 11.5,
    fontWeight: '600',
    color: THEME.colors.textTertiary,
  },
  specDot: {
    color: THEME.colors.textTertiary,
    fontSize: 11,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBarBg: {
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: THEME.colors.accent,
  },
  progressMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressMetaText: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  progressPercentText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.accent,
    fontVariant: ['tabular-nums'],
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 8,
    borderRadius: THEME.radii.sm,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 11.5,
    color: THEME.colors.danger,
  },
  footerRow: {
    borderTopWidth: 1,
    borderTopColor: THEME.colors.borderSubtle,
    paddingTop: 10,
  },
  downloadButton: {
    backgroundColor: THEME.colors.accent,
    paddingVertical: 10,
    borderRadius: THEME.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadButtonText: {
    color: '#080C14',
    fontSize: 13,
    fontWeight: '700',
  },
  downloadingPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  downloadingLabel: {
    fontSize: 12.5,
    color: THEME.colors.accent,
    fontWeight: '600',
  },
  downloadedActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readyIndicatorText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: THEME.colors.success,
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radii.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  deleteButtonText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: THEME.colors.danger,
  },
});
