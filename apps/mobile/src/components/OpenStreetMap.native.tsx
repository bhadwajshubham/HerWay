import { useEffect, useMemo, useRef } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, UrlTile, type LatLng } from 'react-native-maps';
import { theme } from '../theme';
import type { MapPoint, OpenStreetMapProps } from './OpenStreetMap';

export type { MapPoint, OpenStreetMapProps };

const CARTO_DARK_TILES = 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png';

export function OpenStreetMap({
  latitude = 17.4435,
  longitude = 78.3772,
  pickup,
  dropoff,
  captain,
  routeCoordinates,
  height = 230,
  label = 'OpenStreetMap route preview'
}: OpenStreetMapProps) {
  const mapRef = useRef<MapView | null>(null);

  const markerPoints = useMemo<LatLng[]>(() => {
    const pts: LatLng[] = [];
    if (captain) pts.push({ latitude: captain.lat, longitude: captain.lng });
    if (pickup) pts.push({ latitude: pickup.lat, longitude: pickup.lng });
    if (dropoff) pts.push({ latitude: dropoff.lat, longitude: dropoff.lng });
    return pts;
  }, [captain, pickup, dropoff]);

  const routeLine = useMemo<LatLng[]>(() => {
    if (routeCoordinates && routeCoordinates.length >= 2) {
      return routeCoordinates.map((pt) => ({ latitude: pt.lat, longitude: pt.lng }));
    }
    if (pickup && dropoff) {
      return [
        { latitude: pickup.lat, longitude: pickup.lng },
        { latitude: dropoff.lat, longitude: dropoff.lng }
      ];
    }
    return [];
  }, [routeCoordinates, pickup, dropoff]);

  const hasRoadRoute = Boolean(routeCoordinates && routeCoordinates.length > 2);

  const fitTargets = useMemo<LatLng[]>(() => {
    if (routeLine.length >= 2) {
      return captain ? [...routeLine, { latitude: captain.lat, longitude: captain.lng }] : routeLine;
    }
    return markerPoints;
  }, [captain, markerPoints, routeLine]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (fitTargets.length >= 2) {
      map.fitToCoordinates(fitTargets, {
        edgePadding: { top: 44, right: 44, bottom: 44, left: 44 },
        animated: true
      });
    } else {
      const target = fitTargets[0] ?? { latitude, longitude };
      map.animateToRegion(
        {
          latitude: target.latitude,
          longitude: target.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015
        },
        400
      );
    }
  }, [fitTargets, latitude, longitude]);

  const fallbackCenter = markerPoints[0] ?? { latitude, longitude };

  return (
    <View accessibilityLabel={label} style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        mapType="none"
        style={StyleSheet.absoluteFill}
        showsCompass={false}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        initialRegion={{
          latitude: fallbackCenter.latitude,
          longitude: fallbackCenter.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015
        }}
      >
        <UrlTile urlTemplate={CARTO_DARK_TILES} maximumZ={19} flipY={false} zIndex={1} />

        {routeLine.length >= 2 ? (
          <Polyline
            coordinates={routeLine}
            strokeColor={theme.color.teal}
            strokeWidth={hasRoadRoute ? 4 : 3}
            lineDashPattern={hasRoadRoute ? undefined : [6, 5]}
            zIndex={2}
          />
        ) : null}

        {pickup ? (
          <Marker
            coordinate={{ latitude: pickup.lat, longitude: pickup.lng }}
            title="Pickup"
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={3}
          >
            <View style={styles.pickupPin} />
          </Marker>
        ) : null}

        {dropoff ? (
          <Marker
            coordinate={{ latitude: dropoff.lat, longitude: dropoff.lng }}
            title="Dropoff"
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={3}
          >
            <View style={styles.dropoffPin} />
          </Marker>
        ) : null}

        {captain ? (
          <Marker
            coordinate={{ latitude: captain.lat, longitude: captain.lng }}
            title="Captain"
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={4}
          >
            <View style={styles.captainRing}>
              <View style={styles.captainDot} />
            </View>
          </Marker>
        ) : null}

        {!pickup && !dropoff && !captain ? (
          <Marker coordinate={{ latitude, longitude }} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.pickupPin} />
          </Marker>
        ) : null}
      </MapView>

      <Pressable
        onPress={() => void Linking.openURL('https://www.openstreetmap.org/copyright')}
        accessibilityRole="link"
        accessibilityLabel="Open OpenStreetMap attribution"
        style={styles.attribution}
      >
        <Text style={styles.attributionText}>© OSM · CARTO</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    backgroundColor: theme.color.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.color.border
  },
  pickupPin: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.color.teal,
    borderWidth: 2.5,
    borderColor: theme.color.surface
  },
  dropoffPin: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.color.orange,
    borderWidth: 2.5,
    borderColor: theme.color.surface
  },
  captainRing: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(45, 212, 191, 0.28)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  captainDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.color.teal,
    borderWidth: 2,
    borderColor: theme.color.white
  },
  attribution: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    borderRadius: theme.radius.sm,
    backgroundColor: 'rgba(13, 13, 15, 0.78)',
    borderWidth: 1,
    borderColor: theme.color.border,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  attributionText: {
    color: theme.color.muted,
    fontSize: 10,
    fontFamily: theme.font.semibold
  }
});