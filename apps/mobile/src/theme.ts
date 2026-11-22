export const theme = {
  color: {
    // Core dark-mode surfaces
    surface: '#0D0D0F',
    surfaceRaised: '#18191E',
    surfaceDark: '#0D0D0F',
    surfaceDarkRaised: '#18191E',
    webBackdrop: '#050507',

    // Borders
    border: '#262830',
    borderDark: '#262830',

    // Text hierarchy
    ink: '#FFFFFF',
    inkElevated: '#22242C',
    muted: '#A7A7AD',
    white: '#FFFFFF',
    textOnAccent: '#0D0D0F',

    // Accents & semantic status
    teal: '#2DD4BF',
    tealSoft: 'rgba(45, 212, 191, 0.14)',
    orange: '#FF6A00',
    orangeSoft: 'rgba(255, 106, 0, 0.14)',
    danger: '#EF4444',
    dangerSoft: 'rgba(239, 68, 68, 0.16)',
    success: '#22C55E',
    lavender: '#DDD5F3'
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    pill: 999
  },
  layout: {
    screenPadding: 16,
    cardGap: 12,
    webMaxWidth: 430
  },
  touchTarget: 48,
  lavenderScreenShareMax: 0.1,
  typography: {
    largeTitle: { fontSize: 34, fontWeight: '700', lineHeight: 41 },
    title1: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
    title2: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
    headline: { fontSize: 17, fontWeight: '600', lineHeight: 22 },
    body: { fontSize: 15, fontWeight: '400', lineHeight: 22 },
    caption: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
    label: { fontSize: 12, fontWeight: '600', lineHeight: 16 }
  },
  font: {
    regular: 'Inter_400Regular',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold'
  }
} as const;