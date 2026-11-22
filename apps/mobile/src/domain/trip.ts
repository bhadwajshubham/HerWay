import type { GeoPoint } from '@herway/shared';

export function interpolatePoint(from: GeoPoint, to: GeoPoint, progress: number): GeoPoint {
  const clamped = Math.max(0, Math.min(1, progress));
  return {
    lat: from.lat + (to.lat - from.lat) * clamped,
    lng: from.lng + (to.lng - from.lng) * clamped
  };
}

export function tripProgress(startedAt: number, now: number, durationMs: number): number {
  if (durationMs <= 0) return 1;
  return Math.max(0, Math.min(1, (now - startedAt) / durationMs));
}
