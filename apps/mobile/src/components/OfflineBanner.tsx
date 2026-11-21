import { Text, View } from 'react-native';

interface OfflineBannerProps {
  visible: boolean;
  lastUpdatedLabel?: string;
}

export function OfflineBanner({ visible, lastUpdatedLabel }: OfflineBannerProps) {
  if (!visible) return null;

  return (
    <View
      accessible
      accessibilityRole="alert"
      accessibilityLabel={
        lastUpdatedLabel
          ? `Offline. Last known information: ${lastUpdatedLabel}`
          : 'Offline. Showing last known information.'
      }
      style={{ backgroundColor: '#0B1F33', paddingHorizontal: 16, paddingVertical: 10 }}
    >
      <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Offline</Text>
      {lastUpdatedLabel ? (
        <Text style={{ color: '#FFFFFF', marginTop: 2 }}>Last known: {lastUpdatedLabel}</Text>
      ) : null}
    </View>
  );
}
