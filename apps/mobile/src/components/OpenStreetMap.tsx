import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

export interface MapPoint {
  lat: number;
  lng: number;
}

export interface OpenStreetMapProps {
  latitude?: number;
  longitude?: number;
  pickup?: MapPoint;
  dropoff?: MapPoint;
  captain?: MapPoint;
  routeCoordinates?: MapPoint[];
  height?: number;
  label?: string;
}

export function OpenStreetMap({
  height = 230,
  label = 'OpenStreetMap preview'
}: OpenStreetMapProps) {
  return (
    <View accessibilityLabel={label} style={[styles.container, { height }]}>
      <Text style={styles.fallbackText}>Map preview unavailable</Text>
      <Pressable
        onPress={() => void Linking.openURL('https://www.openstreetmap.org/copyright')}
        accessibilityRole="link"
        accessibilityLabel="Open OpenStreetMap attribution"
        style={styles.attribution}
      >
        <Text style={styles.attributionText}>© OpenStreetMap · CARTO</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.surfaceRaised,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.color.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  fallbackText: {
    color: theme.color.muted,
    fontSize: 13,
    fontFamily: theme.font.semibold
  },
  attribution: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    minHeight: 32,
    borderRadius: theme.radius.sm,
    backgroundColor: 'rgba(13, 13, 15, 0.84)',
    borderWidth: 1,
    borderColor: theme.color.border,
    paddingHorizontal: 10,
    justifyContent: 'center'
  },
  attributionText: {
    color: theme.color.muted,
    fontSize: 11,
    fontFamily: theme.font.semibold
  }
});