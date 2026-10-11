import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { theme } from '../theme/tokens';
import { LLMConfig, ModelState } from '../types';

interface ModelCardProps {
  model: LLMConfig;
  state: ModelState;
  isActive: boolean;
  onDownload: () => void;
  onCancel: () => void;
  onLoad: () => void;
  onUnload: () => void;
  onDelete: () => void;
  onSelectAsCurrent: () => void;
}

export const ModelCard: React.FC<ModelCardProps> = ({
  model,
  state,
  isActive,
  onDownload,
  onCancel,
  onLoad,
  onUnload,
  onDelete,
  onSelectAsCurrent,
}) => {
  const isLoaded = state.status === 'ready' && isActive;

  return (
    <View style={[styles.card, isLoaded && styles.cardActive]}>
      {/* Top Meta Header */}
      <View style={styles.cardHeader}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.modelName}>{model.name}</Text>
          <View style={[styles.tagBadge, model.id === 'uncensored' ? styles.tagUncensored : styles.tagStandard]}>
            <Text style={styles.tagText}>{model.tag}</Text>
          </View>
        </View>

        {/* State Pill */}
        <View style={[styles.statusBadge, isLoaded ? styles.badgeActive : state.status === 'downloaded' ? styles.badgeDownloaded : styles.badgeIdle]}>
          <Text style={[styles.statusBadgeText, isLoaded ? styles.textActive : state.status === 'downloaded' ? styles.textDownloaded : styles.textIdle]}>
            {isLoaded ? '● ACTIVE IN RAM' : state.status === 'loading' ? 'LOADING...' : state.status === 'downloaded' ? 'DOWNLOADED' : state.status === 'downloading' ? 'DOWNLOADING' : 'AVAILABLE'}
          </Text>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.descriptionText}>{model.description}</Text>

      {/* File Specs */}
      <View style={styles.specsRow}>
        <Text style={styles.specsText}>📦 {model.sizeEst}</Text>
        <Text style={styles.specsDot}>•</Text>
        <Text style={styles.specsText} numberOfLines={1}>
          {model.filename}
        </Text>
      </View>

      {/* Downloading Progress Bar */}
      {state.status === 'downloading' && (
        <View style={styles.downloadBox}>
          <View style={styles.downloadInfoRow}>
            <View style={styles.downloadTitleGroup}>
              <ActivityIndicator size="small" color={theme.colors.accent} />
              <Text style={styles.downloadingTitle}>Downloading weights...</Text>
            </View>
            <TouchableOpacity onPress={onCancel} style={styles.cancelBtn} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.max(3, state.progress)}%` }]} />
          </View>

          <View style={styles.progressStatsRow}>
            <Text style={styles.progressMbText}>
              {state.writtenMB > 0 ? `${state.writtenMB} MB` : '0 MB'} / {state.totalMB || model.sizeMB} MB
            </Text>
            <Text style={styles.progressPctText}>{state.progress}%</Text>
          </View>
        </View>
      )}

      {/* Loading Indicator */}
      {state.status === 'loading' && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={theme.colors.success} />
          <Text style={styles.loadingText}>Loading model weights into RAM (~2-3s)...</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsRow}>
        {state.status === 'not_downloaded' && (
          <TouchableOpacity style={styles.btnPrimary} onPress={onDownload} activeOpacity={0.8}>
            <Text style={styles.btnTextPrimary}>📥 Download Model ({model.sizeEst})</Text>
          </TouchableOpacity>
        )}

        {state.status === 'downloaded' && (
          <View style={styles.btnGroup}>
            <TouchableOpacity style={styles.btnAccent} onPress={onLoad} activeOpacity={0.8}>
              <Text style={styles.btnTextAccent}>⚡ Load Into RAM</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnDanger} onPress={onDelete} activeOpacity={0.8}>
              <Text style={styles.btnTextDanger}>🗑 Delete</Text>
            </TouchableOpacity>
          </View>
        )}

        {isLoaded && (
          <View style={styles.btnGroup}>
            <View style={styles.activeBanner}>
              <Text style={styles.activeBannerText}>✓ Ready for Offline Reasoning</Text>
            </View>
            <TouchableOpacity style={styles.btnUnload} onPress={onUnload} activeOpacity={0.8}>
              <Text style={styles.btnUnloadText}>Unload</Text>
            </TouchableOpacity>
          </View>
        )}

        {state.status === 'error' && (
          <View style={styles.btnGroup}>
            <TouchableOpacity style={styles.btnPrimary} onPress={onDownload} activeOpacity={0.8}>
              <Text style={styles.btnTextPrimary}>🔄 Retry Download</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnDanger} onPress={onDelete} activeOpacity={0.8}>
              <Text style={styles.btnTextDanger}>Reset</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  cardActive: {
    borderColor: 'rgba(74, 222, 128, 0.4)',
    backgroundColor: 'rgba(19, 30, 51, 0.95)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginRight: 8,
  },
  modelName: {
    ...theme.typography.titleMedium,
  },
  tagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radii.sm,
  },
  tagStandard: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  tagUncensored: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
  },
  badgeActive: {
    backgroundColor: theme.colors.successGlow,
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
  statusBadgeText: {
    ...theme.typography.pill,
  },
  textActive: {
    color: theme.colors.success,
  },
  textDownloaded: {
    color: theme.colors.accent,
  },
  textIdle: {
    color: theme.colors.textSecondary,
  },
  descriptionText: {
    ...theme.typography.bodySmall,
    marginBottom: 10,
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  specsText: {
    ...theme.typography.caption,
  },
  specsDot: {
    color: theme.colors.textTertiary,
  },
  downloadBox: {
    backgroundColor: theme.colors.bgApp,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    marginBottom: 12,
  },
  downloadInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  downloadTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  downloadingTitle: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  cancelBtn: {
    backgroundColor: theme.colors.dangerGlow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.sm,
  },
  cancelBtnText: {
    color: theme.colors.danger,
    fontSize: 11,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    backgroundColor: theme.colors.borderSubtle,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.accent,
    borderRadius: 3,
  },
  progressStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressMbText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  progressPctText: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: '800',
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgApp,
    padding: 12,
    borderRadius: theme.radii.md,
    gap: 10,
    marginBottom: 12,
  },
  loadingText: {
    color: theme.colors.success,
    fontSize: 12,
    fontWeight: '600',
  },
  actionsRow: {
    marginTop: 2,
  },
  btnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnPrimary: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 12,
    borderRadius: theme.radii.md,
    alignItems: 'center',
  },
  btnTextPrimary: {
    color: theme.colors.bgApp,
    fontWeight: '800',
    fontSize: 13,
  },
  btnAccent: {
    flex: 1,
    backgroundColor: theme.colors.success,
    paddingVertical: 11,
    borderRadius: theme.radii.md,
    alignItems: 'center',
  },
  btnTextAccent: {
    color: theme.colors.bgApp,
    fontWeight: '800',
    fontSize: 13,
  },
  btnDanger: {
    backgroundColor: theme.colors.dangerGlow,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: theme.radii.md,
    alignItems: 'center',
  },
  btnTextDanger: {
    color: theme.colors.danger,
    fontWeight: '700',
    fontSize: 12,
  },
  activeBanner: {
    flex: 1,
    backgroundColor: theme.colors.successGlow,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.4)',
    paddingVertical: 11,
    borderRadius: theme.radii.md,
    alignItems: 'center',
  },
  activeBannerText: {
    color: theme.colors.success,
    fontWeight: '700',
    fontSize: 12,
  },
  btnUnload: {
    backgroundColor: theme.colors.bgSurface,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: theme.radii.md,
  },
  btnUnloadText: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
    fontSize: 12,
  },
});
