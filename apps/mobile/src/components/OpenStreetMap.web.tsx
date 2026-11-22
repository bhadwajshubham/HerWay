import { createElement, useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import type { MapPoint, OpenStreetMapProps } from './OpenStreetMap';

export type { MapPoint, OpenStreetMapProps };

const TILE_SIZE = 256;

function worldX(lng: number, zoom: number): number {
  return ((lng + 180) / 360) * TILE_SIZE * 2 ** zoom;
}

function worldY(lat: number, zoom: number): number {
  const clamped = Math.max(-85, Math.min(85, lat));
  const rad = (clamped * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * TILE_SIZE * 2 ** zoom;
}

export function OpenStreetMap({
  latitude = 17.4435,
  longitude = 78.3772,
  pickup,
  dropoff,
  captain,
  routeCoordinates,
  height = 230,
  label = 'OpenStreetMap preview'
}: OpenStreetMapProps) {
  const [width, setWidth] = useState(398);

  const routeLine = useMemo<MapPoint[]>(() => {
    if (routeCoordinates && routeCoordinates.length >= 2) return routeCoordinates;
    if (pickup && dropoff) return [pickup, dropoff];
    return [];
  }, [routeCoordinates, pickup, dropoff]);

  const hasRoadRoute = Boolean(routeCoordinates && routeCoordinates.length > 2);

  const { centerLat, centerLng, zoom } = useMemo(() => {
    const all: MapPoint[] = [...routeLine];
    if (pickup) all.push(pickup);
    if (dropoff) all.push(dropoff);
    if (captain) all.push(captain);

    const first = all[0];
    if (!first) {
      return { centerLat: latitude, centerLng: longitude, zoom: 14 };
    }
    if (all.length === 1) {
      return { centerLat: first.lat, centerLng: first.lng, zoom: 14 };
    }

    let minLat = first.lat;
    let maxLat = first.lat;
    let minLng = first.lng;
    let maxLng = first.lng;
    for (const pt of all) {
      if (pt.lat < minLat) minLat = pt.lat;
      if (pt.lat > maxLat) maxLat = pt.lat;
      if (pt.lng < minLng) minLng = pt.lng;
      if (pt.lng > maxLng) maxLng = pt.lng;
    }

    const cLat = (minLat + maxLat) / 2;
    const cLng = (minLng + maxLng) / 2;
    let chosenZoom = 15;
    for (let z = 15; z >= 10; z -= 1) {
      const spanX = Math.abs(worldX(maxLng, z) - worldX(minLng, z));
      const spanY = Math.abs(worldY(minLat, z) - worldY(maxLat, z));
      if (spanX <= width * 0.72 && spanY <= height * 0.66) {
        chosenZoom = z;
        break;
      }
      chosenZoom = z;
    }

    return { centerLat: cLat, centerLng: cLng, zoom: chosenZoom };
  }, [captain, dropoff, height, latitude, longitude, pickup, routeLine, width]);

  const cx = worldX(centerLng, zoom);
  const cy = worldY(centerLat, zoom);
  const project = (pt: MapPoint) => ({
    x: width / 2 + (worldX(pt.lng, zoom) - cx),
    y: height / 2 + (worldY(pt.lat, zoom) - cy)
  });

  const minTileX = Math.floor((cx - width / 2) / TILE_SIZE);
  const maxTileX = Math.floor((cx + width / 2) / TILE_SIZE);
  const minTileY = Math.floor((cy - height / 2) / TILE_SIZE);
  const maxTileY = Math.floor((cy + height / 2) / TILE_SIZE);
  const maxIndex = 2 ** zoom - 1;

  const tiles: { x: number; y: number; left: number; top: number }[] = [];
  for (let ty = minTileY; ty <= maxTileY; ty += 1) {
    if (ty < 0 || ty > maxIndex) continue;
    for (let tx = minTileX; tx <= maxTileX; tx += 1) {
      const wrappedX = ((tx % (maxIndex + 1)) + (maxIndex + 1)) % (maxIndex + 1);
      tiles.push({
        x: wrappedX,
        y: ty,
        left: Math.round(width / 2 + tx * TILE_SIZE - cx),
        top: Math.round(height / 2 + ty * TILE_SIZE - cy)
      });
    }
  }

  const svgPoints = routeLine
    .map((pt) => {
      const pos = project(pt);
      return `${pos.x.toFixed(1)},${pos.y.toFixed(1)}`;
    })
    .join(' ');

  const pickupPos = pickup ? project(pickup) : null;
  const dropoffPos = dropoff ? project(dropoff) : null;
  const captainPos = captain ? project(captain) : null;
  const defaultPos = !pickup && !dropoff && !captain ? project({ lat: latitude, lng: longitude }) : null;

  return (
    <View
      accessibilityLabel={label}
      onLayout={(event) => {
        const nextWidth = event.nativeEvent.layout.width;
        if (nextWidth > 0 && Math.abs(nextWidth - width) > 2) {
          setWidth(nextWidth);
        }
      }}
      style={[styles.container, { height }]}
    >
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {tiles.map((tile) =>
          createElement('img', {
            key: `${zoom}-${tile.x}-${tile.y}-${tile.left}`,
            src: `https://a.basemaps.cartocdn.com/dark_all/${zoom}/${tile.x}/${tile.y}@2x.png`,
            alt: '',
            width: TILE_SIZE,
            height: TILE_SIZE,
            loading: 'lazy',
            style: {
              position: 'absolute',
              left: tile.left,
              top: tile.top,
              width: TILE_SIZE,
              height: TILE_SIZE,
              display: 'block',
              userSelect: 'none'
            }
          })
        )}

        {routeLine.length >= 2
          ? createElement(
              'svg',
              {
                width,
                height,
                viewBox: `0 0 ${width} ${height}`,
                style: { position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }
              },
              createElement('polyline', {
                points: svgPoints,
                fill: 'none',
                stroke: theme.color.teal,
                strokeWidth: hasRoadRoute ? 4 : 3,
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                strokeDasharray: hasRoadRoute ? undefined : '6 5'
              })
            )
          : null}

        {pickupPos ? (
          <View style={[styles.pickupPin, { left: pickupPos.x - 7, top: pickupPos.y - 7 }]} />
        ) : null}

        {dropoffPos ? (
          <View style={[styles.dropoffPin, { left: dropoffPos.x - 7, top: dropoffPos.y - 7 }]} />
        ) : null}

        {captainPos ? (
          <View style={[styles.captainRing, { left: captainPos.x - 13, top: captainPos.y - 13 }]}>
            <View style={styles.captainDot} />
          </View>
        ) : null}

        {defaultPos ? (
          <View style={[styles.pickupPin, { left: defaultPos.x - 7, top: defaultPos.y - 7 }]} />
        ) : null}
      </View>

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
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.color.teal,
    borderWidth: 2.5,
    borderColor: theme.color.surface
  },
  dropoffPin: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.color.orange,
    borderWidth: 2.5,
    borderColor: theme.color.surface
  },
  captainRing: {
    position: 'absolute',
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
    backgroundColor: 'rgba(13, 13, 15, 0.8)',
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