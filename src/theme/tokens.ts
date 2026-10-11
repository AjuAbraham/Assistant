export const THEME = {
  colors: {
    bgApp: '#080C14',
    bgSurface: '#0E1626',
    bgCard: '#131E33',
    bgCardElevated: '#182744',
    bgCardHover: '#1D2F52',

    borderSubtle: '#1E2C44',
    borderStrong: '#2B3E60',
    borderFocus: '#38BDF8',

    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    textDisabled: '#475569',

    accent: '#38BDF8',
    accentGlow: 'rgba(56, 189, 248, 0.15)',
    accentDark: '#0284C7',

    userBubble: '#243B5A',
    userBubbleText: '#F8FAFC',

    assistantBubble: 'transparent',
    assistantBubbleText: '#E8EEF6',

    success: '#4ADE80',
    successGlow: 'rgba(74, 222, 128, 0.15)',

    danger: '#EF4444',
    dangerGlow: 'rgba(239, 68, 68, 0.15)',

    warning: '#F59E0B',
    warningGlow: 'rgba(245, 158, 11, 0.15)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  radii: {
    xs: 4,
    sm: 6,
    md: 10,
    lg: 14,
    xl: 18,
    full: 9999,
  },
  typography: {
    titleLarge: { fontSize: 20, fontWeight: '800' as const, color: '#F8FAFC', letterSpacing: 0.5 },
    titleMedium: { fontSize: 16, fontWeight: '700' as const, color: '#F8FAFC' },
    sectionHeader: { fontSize: 11, fontWeight: '800' as const, color: '#94A3B8', letterSpacing: 1 },
    body: { fontSize: 14, lineHeight: 22, color: '#F1F5F9' },
    bodySmall: { fontSize: 12, lineHeight: 18, color: '#94A3B8' },
    caption: { fontSize: 11, color: '#64748B', fontWeight: '500' as const },
    pill: { fontSize: 10, fontWeight: '700' as const },
  },
};

export const theme = THEME;
