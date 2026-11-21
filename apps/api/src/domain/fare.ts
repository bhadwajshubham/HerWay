import type { FareEstimateRequest } from '@herway/shared';

const EARTH_RADIUS_KM = 6371.0088;
export const HERWAY_RATE_PER_KM_INR = 11 as const;

function radians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function estimateDistanceKm(
  pickup: FareEstimateRequest['pickup'],
  dropoff: FareEstimateRequest['dropoff']
): number {
  const latitudeDelta = radians(dropoff.lat - pickup.lat);
  const longitudeDelta = radians(dropoff.lng - pickup.lng);
  const pickupLatitude = radians(pickup.lat);
  const dropoffLatitude = radians(dropoff.lat);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(pickupLatitude) * Math.cos(dropoffLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  const boundedHaversine = Math.min(1, Math.max(0, haversine));
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(boundedHaversine));
}

export function estimateFareInr(distanceKm: number): number {
  return Math.round(distanceKm * HERWAY_RATE_PER_KM_INR * 100) / 100;
}
