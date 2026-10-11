import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { THEME } from '../theme/tokens';
import { LLMConfig, ModelState } from '../types';
import { ModelCard } from '../components/ModelCard';

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
}

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
}: ModelsScreenProps) {
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
            <Text style={styles.overviewLabel}>RUNTIME</Text>
            <Text style={[styles.overviewVal, styles.valAccent]}>llama.cpp</Text>
          </View>
        </View>

        <Text style={styles.sectionHeaderTitle}>AVAILABLE ON-DEVICE MODELS</Text>

        {/* Model Cards */}
        {models.map((model) => {
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

        <View style={styles.modelNoteBox}>
          <Text style={styles.modelNoteText}>
            💡 <Text style={{ fontWeight: '700' }}>Note:</Text> Only one model is loaded in RAM at a time to preserve device memory and battery life.
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
    marginBottom: THEME.spacing.lg,
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
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textSecondary,
    letterSpacing: 1,
    marginBottom: THEME.spacing.sm,
    paddingLeft: 2,
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
