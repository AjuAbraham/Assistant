import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { THEME } from '../theme/tokens';
import { NavigationTab } from '../types';

interface BottomNavProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  downloadingCount: number;
  isModelReady: boolean;
}

export function BottomNav({
  activeTab,
  onSelectTab,
  downloadingCount,
  isModelReady,
}: BottomNavProps) {
  const tabs = [
    { id: 'assistant' as NavigationTab, label: 'Assistant', icon: '💬' },
    { id: 'models' as NavigationTab, label: 'Models', icon: '🧠' },
    { id: 'settings' as NavigationTab, label: 'Settings', icon: '⚙️' },
  ];

  return (
    <View style={styles.bottomNav}>
      <View style={styles.navRow}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.navTabBtn, isActive && styles.navTabBtnActive]}
              onPress={() => onSelectTab(tab.id)}
              activeOpacity={0.7}
            >
              <View style={styles.navIconContainer}>
                <Text style={styles.navIconText}>{tab.icon}</Text>
                {tab.id === 'models' && downloadingCount > 0 && (
                  <View style={styles.navDownloadBadge}>
                    <Text style={styles.navDownloadBadgeText}>↓</Text>
                  </View>
                )}
                {tab.id === 'assistant' && isModelReady && (
                  <View style={styles.navReadyDot} />
                )}
              </View>
              <Text
                style={[
                  styles.navLabelText,
                  isActive ? styles.navLabelActive : styles.navLabelInactive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    backgroundColor: THEME.colors.bgSurface,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.borderSubtle,
    paddingTop: THEME.spacing.xs,
    paddingBottom: THEME.spacing.sm,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
  },
  navTabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: THEME.radii.md,
  },
  navTabBtnActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  navIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconText: {
    fontSize: 18,
    marginBottom: 2,
  },
  navLabelText: {
    fontSize: 11,
    fontWeight: '600',
  },
  navLabelActive: {
    color: THEME.colors.accent,
    fontWeight: '700',
  },
  navLabelInactive: {
    color: THEME.colors.textSecondary,
  },
  navDownloadBadge: {
    position: 'absolute',
    top: -2,
    right: -6,
    backgroundColor: THEME.colors.accent,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navDownloadBadgeText: {
    color: THEME.colors.bgApp,
    fontSize: 9,
    fontWeight: '900',
  },
  navReadyDot: {
    position: 'absolute',
    top: 0,
    right: -4,
    backgroundColor: THEME.colors.success,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
