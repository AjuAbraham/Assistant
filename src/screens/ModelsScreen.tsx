import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { THEME } from '../theme/tokens';
import { LLMConfig, ModelState } from '../types';
import { ModelCard } from '../components/ModelCard';
import { SpeechModelCard } from '../components/SpeechModelCard';

interface ModelsScreenProps {
  models: LLMConfig[];
  modelStates: Record<string, ModelState>;
  selectedModel: LLMConfig;
  activeModelId: string | null;
  isModelReady: boolean;
  totalStorageMB: number;
  onDownloadModel: (model: LLMConfig) => void;
  onCancelDownload: (model: LLMConfig) => void;
  onLoadModel: (model: LLMConfig) => void;
  onUnloadModel: (model: LLMConfig) => void;
  onDeleteModel: (model: LLMConfig) => void;
  // Speech model props
  speechModelState: ModelState;
  onDownloadSpeechModel: () => void;
  onDeleteSpeechModel: () => void;
}

type ModelFilter = 'all' | 'downloaded' | 'available';

export function ModelsScreen({
  models,
  modelStates,
  selectedModel,
  activeModelId,
  isModelReady,
  totalStorageMB,
  onDownloadModel,
  onCancelDownload,
  onLoadModel,
  onUnloadModel,
  onDeleteModel,
  speechModelState,
  onDownloadSpeechModel,
  onDeleteSpeechModel,
}: ModelsScreenProps) {
  const [filter, setFilter] = useState<ModelFilter>('all');

  // Categorize LLM models
  const downloadedLLMs = models.filter((m) => {
    const st = modelStates[m.id];
    return st && (st.status === 'downloaded' || st.status === 'ready' || st.status === 'loading');
  });

  const availableLLMs = models.filter((m) => {
    const st = modelStates[m.id];
    return !st || st.status === 'not_downloaded' || st.status === 'downloading' || st.status === 'error';
  });

  // Categorize Speech model
  const isSpeechDownloaded =
    speechModelState.status === 'downloaded' || speechModelState.status === 'ready';

  // Counts
  const totalDownloaded = downloadedLLMs.length + (isSpeechDownloaded ? 1 : 0);
  const totalAvailable = availableLLMs.length + (!isSpeechDownloaded ? 1 : 0);
  const totalAll = models.length + 1;

  // Filtered views
  const showSpeechModel =
    filter === 'all' ||
    (filter === 'downloaded' && isSpeechDownloaded) ||
    (filter === 'available' && !isSpeechDownloaded);

  const displayedLLMs =
    filter === 'all' ? models : filter === 'downloaded' ? downloadedLLMs : availableLLMs;

  const hasAnyModels = showSpeechModel || displayedLLMs.length > 0;

  return (
    <View style={styles.tabContentContainer}>
      <ScrollView contentContainerStyle={styles.modelsScrollContent} showsVerticalScrollIndicator={false}>
        {/* Storage & Memory Overview Header */}
        <View style={styles.modelsOverviewCard}>
          <View style={styles.overviewCol}>
            <Text style={styles.overviewLabel}>RAM ACTIVE</Text>
            <Text style={[styles.overviewVal, isModelReady ? styles.valSuccess : styles.valMuted]}>
              {isModelReady ? selectedModel.name.split(' ')[0] : 'None'}
            </Text>
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewCol}>
            <Text style={styles.overviewLabel}>STORAGE USED</Text>
            <Text style={styles.overviewVal}>
              {totalStorageMB > 0 ? `${(totalStorageMB / 1024).toFixed(2)} GB` : '0 GB'}
            </Text>
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewCol}>
            <Text style={styles.overviewLabel}>RUNTIMES</Text>
            <Text style={[styles.overviewVal, styles.valAccent]}>llama + whisper</Text>
          </View>
        </View>

        {/* Top Filter Segmented Tabs */}
        <View style={styles.filterTabsContainer}>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
            onPress={() => setFilter('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
              All ({totalAll})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, filter === 'downloaded' && styles.filterTabActive]}
            onPress={() => setFilter('downloaded')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === 'downloaded' && styles.filterTabTextActive,
              ]}
            >
              Downloaded ({totalDownloaded})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, filter === 'available' && styles.filterTabActive]}
            onPress={() => setFilter('available')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === 'available' && styles.filterTabTextActive,
              ]}
            >
              Not Downloaded ({totalAvailable})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Empty Filter State */}
        {!hasAnyModels && (
          <View style={styles.emptyFilterBox}>
            <Text style={styles.emptyFilterEmoji}>📦</Text>
            <Text style={styles.emptyFilterTitle}>
              {filter === 'downloaded' ? 'No models downloaded yet' : 'All models are downloaded!'}
            </Text>
            <Text style={styles.emptyFilterSubtitle}>
              {filter === 'downloaded'
                ? 'Switch to the "Not Downloaded" tab above to install offline models.'
                : 'You have installed all available AI models on this device.'}
            </Text>
          </View>
        )}

        {/* Section 1: Voice Recognition Model */}
        {showSpeechModel && (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionHeaderTitle}>VOICE INPUT / SPEECH MODEL</Text>
            <SpeechModelCard
              state={speechModelState}
              onDownload={onDownloadSpeechModel}
              onDelete={onDeleteSpeechModel}
            />
          </View>
        )}

        {/* Section 2: LLM Chat Models */}
        {displayedLLMs.length > 0 && (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionHeaderTitle}>TEXT & REASONING MODELS (LLM)</Text>
            {displayedLLMs.map((model) => {
              const st = modelStates[model.id] || {
                status: 'not_downloaded',
                progress: 0,
                writtenMB: 0,
                totalMB: model.sizeMB,
              };
              const isLoaded = st.status === 'ready' && activeModelId === model.id;

              return (
                <ModelCard
                  key={model.id}
                  model={model}
                  state={st}
                  isLoaded={isLoaded}
                  onDownload={onDownloadModel}
                  onCancel={onCancelDownload}
                  onLoad={onLoadModel}
                  onUnload={onUnloadModel}
                  onDelete={onDeleteModel}
                />
              );
            })}
          </View>
        )}

        <View style={styles.modelNoteBox}>
          <Text style={styles.modelNoteText}>
            💡 <Text style={{ fontWeight: '700' }}>Offline Architecture:</Text> The Whisper voice model handles real-time push-to-talk speech input, while Qwen3/LLM models generate intelligent chat responses. Both run 100% on-device with zero internet connection needed.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabContentContainer: {
    flex: 1,
  },
  modelsScrollContent: {
    padding: THEME.spacing.lg,
    paddingBottom: 40,
  },
  modelsOverviewCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.bgSurface,
    borderRadius: THEME.radii.lg,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.borderSubtle,
    marginBottom: THEME.spacing.md,
  },
  overviewCol: {
    flex: 1,
    alignItems: 'center',
  },
  overviewDivider: {
    width: 1,
    backgroundColor: THEME.colors.borderSubtle,
    marginVertical: 4,
  },
  overviewLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: THEME.colors.textTertiary,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  overviewVal: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  valSuccess: { color: THEME.colors.success },
  valMuted: { color: THEME.colors.textSecondary },
  valAccent: { color: THEME.colors.accent },
  filterTabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: THEME.radii.full,
    padding: 3,
    marginBottom: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.borderSubtle,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: THEME.radii.full,
  },
  filterTabActive: {
    backgroundColor: THEME.colors.accent,
    shadowColor: THEME.colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  filterTabText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  filterTabTextActive: {
    color: '#080C14',
  },
  sectionWrap: {
    marginBottom: THEME.spacing.md,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textSecondary,
    letterSpacing: 1,
    marginBottom: THEME.spacing.sm,
    paddingLeft: 2,
  },
  emptyFilterBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: THEME.radii.lg,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.borderSubtle,
    marginVertical: THEME.spacing.lg,
  },
  emptyFilterEmoji: {
    fontSize: 32,
    marginBottom: 10,
  },
  emptyFilterTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyFilterSubtitle: {
    fontSize: 12.5,
    color: THEME.colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  modelNoteBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: THEME.radii.md,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.colors.borderSubtle,
    marginTop: THEME.spacing.sm,
  },
  modelNoteText: {
    color: THEME.colors.textSecondary,
    fontSize: 11.5,
    lineHeight: 17,
  },
});
