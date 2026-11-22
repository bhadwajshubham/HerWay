export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface OsrmRouteResult {
  coordinates: RoutePoint[];
  distanceKm: number;
  durationMin: number;
  source: 'osrm' | 'estimate';
}

const EARTH_RADIUS_KM = 6371;
const HYDERABAD_AVG_SPEED_KMH = 24;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineKm(from: RoutePoint, to: RoutePoint): number {
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.lat)) *
      Math.cos(toRad(to.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function estimateFallbackRoute(from: RoutePoint, to: RoutePoint): OsrmRouteResult {
  const straightKm = haversineKm(from, to);
  const roadKm = Math.max(0.2, Number((straightKm * 1.25).toFixed(1)));
  const durationMin = Math.max(2, Math.round((roadKm / HYDERABAD_AVG_SPEED_KMH) * 60));
  return {
    coordinates: [from, to],
    distanceKm: roadKm,
    durationMin,
    source: 'estimate'
  };
}

export async function fetchOsrmRoute(
  from: RoutePoint,
  to: RoutePoint,
  signal?: AbortSignal
): Promise<OsrmRouteResult> {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${from.lng},${from.lat};${to.lng},${to.lat}` +
    `?overview=full&geometries=geojson`;

  try {
    const response = await fetch(url, {
      headers: { accept: 'application/json' },
      signal
    });
    if (!response.ok) return estimateFallbackRoute(from, to);

    const payload: unknown = await response.json();
    if (typeof payload !== 'object' || payload === null || !('routes' in payload)) {
      return estimateFallbackRoute(from, to);
    }

    const routes = (payload as { routes?: unknown }).routes;
    if (!Array.isArray(routes) || routes.length === 0) {
      return estimateFallbackRoute(from, to);
    }

    const first = routes[0] as {
      distance?: unknown;
      duration?: unknown;
      geometry?: { coordinates?: unknown };
    };

    const rawCoords = first.geometry?.coordinates;
    if (!Array.isArray(rawCoords) || rawCoords.length < 2) {
      return estimateFallbackRoute(from, to);
    }

    const coordinates: RoutePoint[] = [];
    for (const pair of rawCoords) {
      if (
        Array.isArray(pair) &&
        pair.length >= 2 &&
        typeof pair[0] === 'number' &&
        typeof pair[1] === 'number' &&
        Number.isFinite(pair[0]) &&
        Number.isFinite(pair[1])
      ) {
        coordinates.push({ lat: pair[1], lng: pair[0] });
      }
    }

    if (coordinates.length < 2) {
      return estimateFallbackRoute(from, to);
    }

    const distanceMeters = typeof first.distance === 'number' ? first.distance : 0;
    const durationSeconds = typeof first.duration === 'number' ? first.duration : 0;
    const distanceKm = Math.max(0.1, Number((distanceMeters / 1000).toFixed(1)));
    const durationMin = Math.max(1, Math.round(durationSeconds / 60));

    return {
      coordinates,
      distanceKm,
      durationMin,
      source: 'osrm'
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    return estimateFallbackRoute(from, to);
  }
}

export function formatDistanceKm(distanceKm: number): string {
  return `${distanceKm.toFixed(1)} km`;
}

export function formatEtaMinutes(durationMin: number): string {
  if (durationMin < 60) return `${durationMin} min`;
  const hours = Math.floor(durationMin / 60);
  const mins = durationMin % 60;
  return mins === 0 ? `${hours} hr` : `${hours} hr ${mins} min`;
}