import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { THEME } from '../theme/tokens';
import { LLMConfig, ModelState } from '../types';

interface ModelCardProps {
  model: LLMConfig;
  state: ModelState;
  isLoaded: boolean;
  onDownload: (model: LLMConfig) => void;
  onCancel: (model: LLMConfig) => void;
  onLoad: (model: LLMConfig) => void;
  onUnload: (model: LLMConfig) => void;
  onDelete: (model: LLMConfig) => void;
}

export function ModelCard({
  model,
  state,
  isLoaded,
  onDownload,
  onCancel,
  onLoad,
  onUnload,
  onDelete,
}: ModelCardProps) {
  const isDownloading = state.status === 'downloading';
  const isDownloaded = state.status === 'downloaded';
  const isLoading = state.status === 'loading';
  const isError = state.status === 'error';
  const isNotDownloaded = state.status === 'not_downloaded';

  return (
    <View style={[styles.modelCard, isLoaded && styles.modelCardActive]}>
      <View style={styles.modelCardHeader}>
        <View style={styles.modelNameRow}>
          <Text style={styles.modelNameText}>{model.name}</Text>
          <View
            style={[
              styles.tagBadge,
              model.tag === 'UNFILTERED'
                ? styles.tagUnfiltered
                : model.tag === 'FAST'
                ? styles.tagFast
                : model.tag === 'UNCENSORED'
                ? styles.tagUncensored
                : styles.tagStandard,
            ]}
          >
            <Text style={styles.tagBadgeText}>{model.tag}</Text>
          </View>
        </View>

        <View
          style={[
            styles.modelStateBadge,
            isLoaded
              ? styles.badgeReady
              : isDownloaded
              ? styles.badgeDownloaded
              : styles.badgeIdle,
          ]}
        >
          <Text
            style={[
              styles.modelStateBadgeText,
              isLoaded
                ? styles.textReady
                : isDownloaded
                ? styles.textDownloaded
                : styles.textIdle,
            ]}
          >
            {isLoaded
              ? '● ACTIVE IN RAM'
              : isLoading
              ? 'LOADING...'
              : isDownloaded
              ? 'DOWNLOADED'
              : isDownloading
              ? 'DOWNLOADING'
              : 'AVAILABLE'}
          </Text>
        </View>
      </View>

      <Text style={styles.modelDescriptionText}>{model.description}</Text>

      <View style={styles.modelSpecsRow}>
        <Text style={styles.modelSpecsText}>
          📦 {model.sizeEst || `${(model.sizeMB / 1024).toFixed(2)} GB`}
        </Text>
        {model.quant && (
          <>
            <Text style={styles.modelSpecsDot}>•</Text>
            <Text style={styles.modelSpecsText}>{model.quant}</Text>
          </>
        )}
        {model.ramHint && (
          <>
            <Text style={styles.modelSpecsDot}>•</Text>
            <Text style={styles.modelSpecsText}>{model.ramHint}</Text>
          </>
        )}
      </View>

      {/* Download Progress Bar */}
      {isDownloading && (
        <View style={styles.downloadProgressBox}>
          <View style={styles.downloadProgressHeader}>
            <View style={styles.downloadingTitleRow}>
              <ActivityIndicator size="small" color={THEME.colors.accent} />
              <Text style={styles.downloadingTitleText}>Downloading weights...</Text>
            </View>
            <TouchableOpacity
              onPress={() => onCancel(model)}
              style={styles.downloadCancelBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.downloadCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${Math.max(3, state.progress)}%` }]}
            />
          </View>

          <View style={styles.progressNumbersRow}>
            <Text style={styles.progressMbText}>
              {state.writtenMB > 0 ? `${state.writtenMB} MB` : '0 MB'} /{' '}
              {state.totalMB || model.sizeMB} MB
            </Text>
            <Text style={styles.progressPctText}>{state.progress}%</Text>
          </View>
        </View>
      )}

      {/* Loading State */}
      {isLoading && (
        <View style={styles.modelLoadingBox}>
          <ActivityIndicator size="small" color={THEME.colors.success} />
          <Text style={styles.modelLoadingText}>Loading model weights into RAM (~2-3s)...</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.modelActionsRow}>
        {isNotDownloaded && (
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => onDownload(model)}
            activeOpacity={0.8}
          >
            <Text style={styles.btnPrimaryText}>📥 Download Model ({model.sizeEst})</Text>
          </TouchableOpacity>
        )}

        {isDownloaded && (
          <View style={styles.buttonSplitRow}>
            <TouchableOpacity
              style={styles.btnSuccess}
              onPress={() => onLoad(model)}
              activeOpacity={0.8}
            >
              <Text style={styles.btnSuccessText}>⚡ Load Into RAM</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnDanger}
              onPress={() => onDelete(model)}
              activeOpacity={0.8}
            >
              <Text style={styles.btnDangerText}>🗑 Delete</Text>
            </TouchableOpacity>
          </View>
        )}

        {isLoaded && (
          <View style={styles.buttonSplitRow}>
            <View style={styles.activeRamBanner}>
              <Text style={styles.activeRamBannerText}>✓ Active for Offline Chat</Text>
            </View>
            <TouchableOpacity
              style={styles.btnUnload}
              onPress={() => onUnload(model)}
              activeOpacity={0.8}
            >
              <Text style={styles.btnUnloadText}>Unload</Text>
            </TouchableOpacity>
          </View>
        )}

        {isError && (
          <View style={styles.buttonSplitRow}>
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={() => onDownload(model)}
              activeOpacity={0.8}
            >
              <Text style={styles.btnPrimaryText}>🔄 Retry Download</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnDanger}
              onPress={() => onDelete(model)}
              activeOpacity={0.8}
            >
              <Text style={styles.btnDangerText}>Reset</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modelCard: {
    backgroundColor: THEME.colors.bgCard,
    borderRadius: THEME.radii.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.borderSubtle,
  },
  modelCardActive: {
    borderColor: 'rgba(74, 222, 128, 0.4)',
    backgroundColor: 'rgba(19, 30, 51, 0.95)',
  },
  modelCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  modelNameRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginRight: 8,
  },
  modelNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  tagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: THEME.radii.sm,
  },
  tagStandard: { backgroundColor: 'rgba(56, 189, 248, 0.15)' },
  tagUnfiltered: { backgroundColor: 'rgba(239, 68, 68, 0.18)' },
  tagFast: { backgroundColor: 'rgba(74, 222, 128, 0.18)' },
  tagUncensored: { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
  tagBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  modelStateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radii.sm,
    borderWidth: 1,
  },
  badgeReady: {
    backgroundColor: THEME.colors.successGlow,
    borderColor: 'rgba(74, 222, 128, 0.5)',
  },
  badgeDownloaded: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  badgeIdle: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modelStateBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  textReady: { color: THEME.colors.success },
  textDownloaded: { color: THEME.colors.accent },
  textIdle: { color: THEME.colors.textSecondary },
  modelDescriptionText: {
    fontSize: 12,
    lineHeight: 18,
    color: THEME.colors.textSecondary,
    marginBottom: 10,
  },
  modelSpecsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  modelSpecsText: {
    fontSize: 11,
    color: THEME.colors.textTertiary,
  },
  modelSpecsDot: {
    color: THEME.colors.textTertiary,
  },
  downloadProgressBox: {
    backgroundColor: THEME.colors.bgApp,
    borderRadius: THEME.radii.md,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.borderSubtle,
    marginBottom: 12,
  },
  downloadProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  downloadingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  downloadingTitleText: {
    color: THEME.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  downloadCancelBtn: {
    backgroundColor: THEME.colors.dangerGlow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radii.sm,
  },
  downloadCancelBtnText: {
    color: THEME.colors.danger,
    fontSize: 11,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    backgroundColor: THEME.colors.borderSubtle,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: THEME.colors.accent,
    borderRadius: 3,
  },
  progressNumbersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressMbText: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  progressPctText: {
    color: THEME.colors.accent,
    fontSize: 11,
    fontWeight: '800',
  },
  modelLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.bgApp,
    padding: 12,
    borderRadius: THEME.radii.md,
    gap: 10,
    marginBottom: 12,
  },
  modelLoadingText: {
    color: THEME.colors.success,
    fontSize: 12,
    fontWeight: '600',
  },
  modelActionsRow: {
    marginTop: 2,
  },
  buttonSplitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnPrimary: {
    backgroundColor: THEME.colors.accent,
    paddingVertical: 12,
    borderRadius: THEME.radii.md,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: THEME.colors.bgApp,
    fontWeight: '800',
    fontSize: 13,
  },
  btnSuccess: {
    flex: 1,
    backgroundColor: THEME.colors.success,
    paddingVertical: 11,
    borderRadius: THEME.radii.md,
    alignItems: 'center',
  },
  btnSuccessText: {
    color: THEME.colors.bgApp,
    fontWeight: '800',
    fontSize: 13,
  },
  btnDanger: {
    backgroundColor: THEME.colors.dangerGlow,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: THEME.radii.md,
    alignItems: 'center',
  },
  btnDangerText: {
    color: THEME.colors.danger,
    fontWeight: '700',
    fontSize: 12,
  },
  activeRamBanner: {
    flex: 1,
    backgroundColor: THEME.colors.successGlow,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.4)',
    paddingVertical: 11,
    borderRadius: THEME.radii.md,
    alignItems: 'center',
  },
  activeRamBannerText: {
    color: THEME.colors.success,
    fontWeight: '700',
    fontSize: 12,
  },
  btnUnload: {
    backgroundColor: THEME.colors.bgSurface,
    borderWidth: 1,
    borderColor: THEME.colors.borderSubtle,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: THEME.radii.md,
  },
  btnUnloadText: {
    color: THEME.colors.textSecondary,
    fontWeight: '600',
    fontSize: 12,
  },
});
