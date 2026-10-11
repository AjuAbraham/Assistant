import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { theme } from '../theme/tokens';
import { LLMConfig, ModelState } from '../types';
import { ModelCard } from '../components/ModelCard';

interface ModelsScreenProps {
  models: LLMConfig[];
  modelStates: Record<string, ModelState>;
  activeModelId: string | null;
  onDownloadModel: (model: LLMConfig) => void;
  onCancelDownload: (model: LLMConfig) => void;
  onLoadModel: (model: LLMConfig) => void;
  onUnloadModel: (model: LLMConfig) => void;
  onDeleteModel: (model: LLMConfig) => void;
  onSelectModel: (model: LLMConfig) => void;
}

export const ModelsScreen: React.FC<ModelsScreenProps> = ({
  models,
  modelStates,
  activeModelId,
  onDownloadModel,
  onCancelDownload,
  onLoadModel,
  onUnloadModel,
  onDeleteModel,
  onSelectModel,
}) => {
  const activeModel = models.find((m) => m.id === activeModelId);
  const totalStorageMB = Object.values(modelStates).reduce((acc, st) => {
    return st.status === 'downloaded' || st.status === 'ready' ? acc + (st.writtenMB || 0) : acc;
  }, 0);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Memory & Device Status Card */}
        <View style={styles.statsCard}>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>RAM INFERENCE</Text>
            <Text style={[styles.statValue, activeModel ? styles.textSuccess : styles.textMuted]}>
              {activeModel ? activeModel.name.split(' ')[0] : 'Idle'}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>LOCAL STORAGE</Text>
            <Text style={styles.statValue}>
              {totalStorageMB > 0 ? `${(totalStorageMB / 1024).toFixed(2)} GB` : '0 GB'}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>RUNTIME</Text>
            <Text style={[styles.statValue, styles.textAccent]}>llama.cpp</Text>
          </View>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>AVAILABLE LOCAL MODELS</Text>
          <Text style={styles.sectionSubtitle}>Download on Wi-Fi recommended</Text>
        </View>

        {/* Model Cards */}
        {models.map((model) => (
          <ModelCard
            key={model.id}
            model={model}
            state={
              modelStates[model.id] || {
                status: 'not_downloaded',
                progress: 0,
                writtenMB: 0,
                totalMB: model.sizeMB,
              }
            }
            isActive={activeModelId === model.id}
            onDownload={() => onDownloadModel(model)}
            onCancel={() => onCancelDownload(model)}
            onLoad={() => onLoadModel(model)}
            onUnload={() => onUnloadModel(model)}
            onDelete={() => onDeleteModel(model)}
            onSelectAsCurrent={() => onSelectModel(model)}
          />
        ))}

        {/* Architecture Note */}
        <View style={styles.infoFooter}>
          <Text style={styles.infoFooterText}>
            💡 <Text style={{ fontWeight: '700' }}>Note:</Text> Models are stored in private app storage. Only one model can be active in RAM at any time to preserve device battery and memory headroom.
          </Text>
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
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.bgSurface,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    marginBottom: theme.spacing.lg,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.borderSubtle,
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: theme.colors.textTertiary,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  textSuccess: {
    color: theme.colors.success,
  },
  textMuted: {
    color: theme.colors.textSecondary,
  },
  textAccent: {
    color: theme.colors.accent,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: theme.spacing.md,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    ...theme.typography.sectionHeader,
  },
  sectionSubtitle: {
    ...theme.typography.caption,
  },
  infoFooter: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: theme.radii.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    marginTop: theme.spacing.sm,
  },
  infoFooterText: {
    color: theme.colors.textSecondary,
    fontSize: 11.5,
    lineHeight: 17,
  },
});
