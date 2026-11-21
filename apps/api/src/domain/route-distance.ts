import { z } from 'zod';
import type { FareEstimateRequest, ScheduledRideRequest } from '@herway/shared';
import { estimateDistanceKm } from './fare.js';

const GoogleRoutesResponseSchema = z.object({
  routes: z.array(z.object({ distanceMeters: z.number().int().positive() })).min(1)
});

const ROUTES_ENDPOINT = 'https://routes.googleapis.com/directions/v2:computeRoutes';
const ROUTE_TIMEOUT_MS = 8_000;

export class RouteDistanceUnavailableError extends Error {
  constructor() {
    super('Route distance is temporarily unavailable');
    this.name = 'RouteDistanceUnavailableError';
  }
}

export interface RouteDistanceResult {
  distanceKm: number;
  source: 'google_routes' | 'great_circle_demo';
}

type RouteLocation =
  | { lat: number; lng: number }
  | { address: string };

function toRouteLocation(value: string | { lat: number; lng: number }): RouteLocation {
  return typeof value === 'string' ? { address: value } : value;
}

function toGoogleWaypoint(location: RouteLocation): unknown {
  if ('address' in location) return { address: location.address };
  return { location: { latLng: { latitude: location.lat, longitude: location.lng } } };
}

function isCoordinateLocation(location: RouteLocation): location is { lat: number; lng: number } {
  return 'lat' in location && 'lng' in location;
}

export async function getRouteDistanceKm(
  input: Pick<FareEstimateRequest, 'pickup' | 'dropoff'> | Pick<ScheduledRideRequest, 'pickup' | 'dropoff'>,
  options: { apiKey?: string; allowDemoFallback: boolean; fetcher?: typeof fetch }
): Promise<RouteDistanceResult> {
  const pickup = toRouteLocation(input.pickup);
  const dropoff = toRouteLocation(input.dropoff);
  if (!options.apiKey) {
    if (options.allowDemoFallback) {
      if (!isCoordinateLocation(pickup) || !isCoordinateLocation(dropoff)) {
        throw new RouteDistanceUnavailableError();
      }
      return {
        distanceKm: estimateDistanceKm(pickup, dropoff),
        source: 'great_circle_demo'
      };
    }
    throw new RouteDistanceUnavailableError();
  }

  const fetcher = options.fetcher ?? fetch;
  let response: Response;
  try {
    response = await fetcher(ROUTES_ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': options.apiKey,
        'x-goog-fieldmask': 'routes.distanceMeters'
      },
      body: JSON.stringify({
        origin: toGoogleWaypoint(pickup),
        destination: toGoogleWaypoint(dropoff),
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_UNAWARE'
      }),
      signal: AbortSignal.timeout(ROUTE_TIMEOUT_MS)
    });
  } catch {
    throw new RouteDistanceUnavailableError();
  }

  if (!response.ok) throw new RouteDistanceUnavailableError();

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new RouteDistanceUnavailableError();
  }
  const parsed = GoogleRoutesResponseSchema.safeParse(body);
  if (!parsed.success) throw new RouteDistanceUnavailableError();

  const distanceMeters = parsed.data.routes[0].distanceMeters;
  if (distanceMeters > 1_000_000) throw new RouteDistanceUnavailableError();

  return { distanceKm: distanceMeters / 1000, source: 'google_routes' };
}
