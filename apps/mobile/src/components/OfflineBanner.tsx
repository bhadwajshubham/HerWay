import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

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
      style={styles.banner}
    >
      <View style={styles.dot} />
      <View style={styles.copy}>
        <Text style={styles.title}>Offline</Text>
        {lastUpdatedLabel ? (
          <Text style={styles.subtitle}>Last known: {lastUpdatedLabel}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.color.surfaceRaised,
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.45)',
    borderRadius: theme.radius.lg,
    marginHorizontal: theme.layout.screenPadding,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.color.orange
  },
  copy: {
    flex: 1
  },
  title: {
    color: theme.color.white,
    fontSize: 13,
    fontFamily: theme.font.bold
  },
  subtitle: {
    color: theme.color.muted,
    fontSize: 12,
    fontFamily: theme.font.regular,
    marginTop: 2
  }
});