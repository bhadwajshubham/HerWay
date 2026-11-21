import { describe, expect, it, vi } from 'vitest';
import { getRouteDistanceKm, RouteDistanceUnavailableError } from './route-distance.js';

const input = {
  pickup: { lat: 17.4435, lng: 78.3772 },
  dropoff: { lat: 17.45, lng: 78.38 }
};

describe('Google route distance', () => {
  it('uses the validated road route distance from Google Routes', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ routes: [{ distanceMeters: 2750 }] }), { status: 200 })
    );

    await expect(getRouteDistanceKm(input, { apiKey: 'server-key', allowDemoFallback: false, fetcher }))
      .resolves.toEqual({ distanceKm: 2.75, source: 'google_routes' });
    expect(fetcher).toHaveBeenCalledWith(
      'https://routes.googleapis.com/directions/v2:computeRoutes',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'x-goog-fieldmask': 'routes.distanceMeters' })
      })
    );
  });

  it('rejects provider outages and malformed route responses', async () => {
    const unavailableFetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 503 }));
    await expect(
      getRouteDistanceKm(input, {
        apiKey: 'server-key',
        allowDemoFallback: false,
        fetcher: unavailableFetcher
      })
    ).rejects.toBeInstanceOf(RouteDistanceUnavailableError);

    const malformedFetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ routes: [{ distanceMeters: 'unknown' }] }), { status: 200 })
    );
    await expect(
      getRouteDistanceKm(input, { apiKey: 'server-key', allowDemoFallback: false, fetcher: malformedFetcher })
    ).rejects.toBeInstanceOf(RouteDistanceUnavailableError);
  });

  it('only falls back to great-circle distance when explicitly allowed', async () => {
    await expect(getRouteDistanceKm(input, { allowDemoFallback: true })).resolves.toMatchObject({
      source: 'great_circle_demo'
    });
    await expect(getRouteDistanceKm(input, { allowDemoFallback: false })).rejects.toBeInstanceOf(
      RouteDistanceUnavailableError
    );
  });

  it('passes user-entered scheduled addresses to Google Routes without logging them', async () => {
    let sentBody: unknown;
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async (_input, init) => {
      sentBody = JSON.parse(String(init?.body)) as unknown;
      return new Response(JSON.stringify({ routes: [{ distanceMeters: 4200 }] }), { status: 200 });
    });
    await expect(
      getRouteDistanceKm(
        { pickup: 'HerWay Tower, Hyderabad', dropoff: 'RGIA, Hyderabad' },
        { apiKey: 'server-key', allowDemoFallback: false, fetcher }
      )
    ).resolves.toEqual({ distanceKm: 4.2, source: 'google_routes' });
    expect(sentBody).toMatchObject({
      origin: { address: 'HerWay Tower, Hyderabad' },
      destination: { address: 'RGIA, Hyderabad' }
    });
  });

  it('maps a routing network failure to the safe unavailable error', async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error('provider network error'));
    await expect(
      getRouteDistanceKm(input, { apiKey: 'server-key', allowDemoFallback: false, fetcher })
    ).rejects.toBeInstanceOf(RouteDistanceUnavailableError);
  });
});
