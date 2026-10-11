import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { theme } from '../theme/tokens';
import { NavigationTab } from '../types';

interface BottomNavProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isModelReady: boolean;
  downloadingCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  isModelReady,
  downloadingCount = 0,
}) => {
  const tabs: { id: NavigationTab; label: string; icon: string }[] = [
    { id: 'assistant', label: 'Assistant', icon: '💬' },
    { id: 'models', label: 'Models', icon: '🧠' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <View style={styles.navContainer}>
      <View style={styles.tabsRow}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => onSelectTab(tab.id)}
              activeOpacity={0.7}
            >
              <View style={styles.iconWrapper}>
                <Text style={styles.tabIcon}>{tab.icon}</Text>
                {tab.id === 'models' && downloadingCount > 0 && (
                  <View style={styles.badgeDownload}>
                    <Text style={styles.badgeDownloadText}>↓</Text>
                  </View>
                )}
                {tab.id === 'assistant' && isModelReady && (
                  <View style={styles.badgeReadyDot} />
                )}
              </View>
              <Text style={[styles.tabLabel, isActive ? styles.tabLabelActive : styles.tabLabelInactive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    backgroundColor: theme.colors.bgSurface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.sm,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: theme.radii.md,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: theme.colors.accent,
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: theme.colors.textSecondary,
  },
  badgeDownload: {
    position: 'absolute',
    top: -2,
    right: -6,
    backgroundColor: theme.colors.accent,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDownloadText: {
    color: theme.colors.bgApp,
    fontSize: 9,
    fontWeight: '900',
  },
  badgeReadyDot: {
    position: 'absolute',
    top: 0,
    right: -4,
    backgroundColor: theme.colors.success,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
