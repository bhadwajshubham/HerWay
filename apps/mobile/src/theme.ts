export const theme = {
  color: {
    ink: '#0B1F33',
    inkElevated: '#112A40',
    teal: '#116C66',
    tealSoft: '#DDF4F1',
    surface: '#F7FAFC',
    surfaceRaised: '#FFFFFF',
    surfaceDark: '#0D0D0F',
    surfaceDarkRaised: '#18181C',
    border: '#D9E5EA',
    borderDark: '#34343B',
    muted: '#31546B',
    lavender: '#DDD5F3',
    danger: '#A52A2A',
    white: '#FFFFFF',
    orange: '#FF6A00',
    orangeSoft: '#FFF1E8'
  },
  touchTarget: 48,
  lavenderScreenShareMax: 0.1,
  typography: {
    largeTitle: { fontSize: 34, fontWeight: '700', lineHeight: 41 },
    title1: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
    headline: { fontSize: 17, fontWeight: '600', lineHeight: 22 },
    body: { fontSize: 17, fontWeight: '400', lineHeight: 22 }
  },
  font: {
    regular: 'Inter_400Regular',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold'
  }
} as const;
