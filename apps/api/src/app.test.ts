import { describe, expect, it } from 'vitest';
import { buildApp } from './app.js';

describe('core API integration', () => {
  it('requires a Firebase identity for scheduled ride requests and request history', async () => {
    const app = buildApp();
    const headers = { 'idempotency-key': 'scheduled-test-key-01' };
    const create = await app.inject({
      method: 'POST',
      url: '/api/v1/scheduled-rides/requests',
      headers,
      payload: {}
    });
    expect(create.statusCode).toBe(401);
    expect(create.json()).toMatchObject({ error: { code: 'UNAUTHORIZED' } });

    const list = await app.inject({ method: 'GET', url: '/api/v1/scheduled-rides/requests' });
    expect(list.statusCode).toBe(401);
    expect(list.json()).toMatchObject({ error: { code: 'UNAUTHORIZED' } });
    await app.close();
  });

  it('requires a Firebase identity to request or view private Work Circle membership', async () => {
    const app = buildApp();
    const headers = { 'idempotency-key': 'circle-member-test-001' };
    const create = await app.inject({
      method: 'POST',
      url: '/api/v1/circles/circle-123/membership-requests',
      headers,
      payload: {}
    });
    expect(create.statusCode).toBe(401);
    expect(create.json()).toMatchObject({ error: { code: 'UNAUTHORIZED' } });

    const status = await app.inject({
      method: 'GET',
      url: '/api/v1/circles/circle-123/membership-status'
    });
    expect(status.statusCode).toBe(401);
    expect(status.json()).toMatchObject({ error: { code: 'UNAUTHORIZED' } });
    const discover = await app.inject({ method: 'GET', url: '/api/v1/circles/available' });
    expect(discover.statusCode).toBe(401);
    expect(discover.json()).toMatchObject({ error: { code: 'UNAUTHORIZED' } });
    await app.close();
  });

  it('returns liveness, readiness, and public demo config', async () => {
    const app = buildApp();

    const live = await app.inject({ method: 'GET', url: '/health/live' });
    expect(live.statusCode).toBe(200);
    expect(live.headers['x-request-id']).toBeTruthy();
    expect(live.json()).toMatchObject({ status: 'ok', service: 'herway-api', version: '0.1.0' });

    const ready = await app.inject({ method: 'GET', url: '/health/ready' });
    expect(ready.statusCode).toBe(200);
    expect(ready.json()).toMatchObject({
      status: 'ok',
      firebaseAdminConfigured: false
    });

    const config = await app.inject({ method: 'GET', url: '/api/v1/config/public' });
    expect(config.statusCode).toBe(200);
    expect(config.json()).toMatchObject({
      appMode: expect.stringMatching(/^(demo|live)$/),
      liveDispatchEnabled: false,
      womenOnlyDefault: true,
      pilotZones: ['HITEC City corridor', 'Partner campus or office']
    });

    await app.close();
  });

  it('returns the standard error envelope for unknown routes', async () => {
    const app = buildApp();

    const response = await app.inject({ method: 'GET', url: '/api/v1/not-a-route' });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found',
        requestId: expect.any(String)
      }
    });

    await app.close();
  });

  it('requires idempotency and returns validation envelope for auth verification', async () => {
    const app = buildApp();

    const missingKey = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/firebase/verify',
      payload: { idToken: 'a'.repeat(40) }
    });
    expect(missingKey.statusCode).toBe(400);
    expect(missingKey.json()).toMatchObject({
      error: { code: 'IDEMPOTENCY_KEY_REQUIRED', requestId: expect.any(String) }
    });

    await app.close();
  });

  it('rejects unauthenticated profile updates in the Firebase pilot', async () => {
    const app = buildApp();

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/me',
      headers: { 'idempotency-key': 'profile-test-12345' },
      payload: { displayName: 'Test Rider', preferredLanguage: 'en', accessibilityPreferences: [] }
    });
    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      error: { code: 'UNAUTHORIZED', requestId: expect.any(String) }
    });

    await app.close();
  });

  it('rejects unauthenticated profile reads and photo signatures', async () => {
    const app = buildApp();

    const profile = await app.inject({ method: 'GET', url: '/api/v1/me' });
    expect(profile.statusCode).toBe(401);
    expect(profile.json()).toMatchObject({
      error: { code: 'UNAUTHORIZED', requestId: expect.any(String) }
    });

    const signature = await app.inject({
      method: 'POST',
      url: '/api/v1/me/photo/upload-signature',
      headers: { 'idempotency-key': 'photo-signature-test-123' },
      payload: {}
    });
    expect(signature.statusCode).toBe(401);
    expect(signature.json()).toMatchObject({
      error: { code: 'UNAUTHORIZED', requestId: expect.any(String) }
    });

    await app.close();
  });

  it('runs the complete demo ride and SOS overlay vertical slice', async () => {
    const app = buildApp();

    const estimate = await app.inject({
      method: 'POST',
      url: '/api/v1/demo/fares/estimate',
      payload: {
        pickup: { lat: 17.4435, lng: 78.3772 },
        dropoff: { lat: 17.4502, lng: 78.3808 },
        rideCategory: 'standard'
      }
    });
    expect(estimate.statusCode).toBe(200);
    expect(estimate.json()).toMatchObject({
      demo: true,
      mode: 'demo',
      currency: 'INR',
      ratePerKm: 11,
      explanation: expect.stringContaining('great-circle distance')
    });
    expect(estimate.json().amountMin).toBe(estimate.json().amountMax);

    const badEstimate = await app.inject({
      method: 'POST',
      url: '/api/v1/demo/fares/estimate',
      payload: { rideCategory: 'standard' }
    });
    expect(badEstimate.statusCode).toBe(400);

    const headers = { 'idempotency-key': 'demo-request-123', 'x-demo-rider-id': 'demo-rider-test' };
    const requestRide = await app.inject({
      method: 'POST',
      url: '/api/v1/demo/rides/intents/request',
      headers,
      payload: {
        pickup: { lat: 17.4435, lng: 78.3772 },
        dropoff: { lat: 17.4502, lng: 78.3808 },
        rideCategory: 'standard'
      }
    });
    expect(requestRide.statusCode).toBe(201);
    const ride = requestRide.json();
    expect(ride).toMatchObject({
      demo: true,
      mode: 'demo',
      state: 'SEARCHING',
      payment: 'NOT_REQUESTED'
    });

    const replay = await app.inject({
      method: 'POST',
      url: '/api/v1/demo/rides/intents/request',
      headers,
      payload: {
        pickup: { lat: 17.4435, lng: 78.3772 },
        dropoff: { lat: 17.4502, lng: 78.3808 },
        rideCategory: 'standard'
      }
    });
    expect(replay.statusCode).toBe(201);
    expect(replay.json().rideId).toBe(ride.rideId);

    const status = await app.inject({
      method: 'GET',
      url: `/api/v1/demo/rides/${ride.rideId}/status`,
      headers: { 'x-demo-rider-id': 'demo-rider-test' }
    });
    expect(status.statusCode).toBe(200);
    expect(status.json()).toMatchObject({ state: 'SEARCHING', demo: true });

    const sos = await app.inject({
      method: 'POST',
      url: '/api/v1/demo/sos/intents/activate',
      headers: { 'idempotency-key': 'demo-sos-123', 'x-demo-rider-id': 'demo-rider-test' },
      payload: { rideId: ride.rideId, intent: 'ACTIVATE_SOS_OVERLAY' }
    });
    expect(sos.statusCode).toBe(201);
    expect(sos.json()).toMatchObject({
      demo: true,
      overlay: 'ACTIVE',
      emergencyServicesContacted: false,
      rideState: 'SEARCHING'
    });

    const cancel = await app.inject({
      method: 'POST',
      url: `/api/v1/demo/rides/${ride.rideId}/intents/cancel`,
      headers: { 'idempotency-key': 'demo-cancel-123', 'x-demo-rider-id': 'demo-rider-test' },
      payload: { reason: 'safety_concern' }
    });
    expect(cancel.statusCode).toBe(200);
    expect(cancel.json()).toMatchObject({
      state: 'CANCELLED',
      reason: 'safety_concern',
      demo: true
    });

    await app.close();
  });

  it('requires idempotency and ownership for demo ride state changes', async () => {
    const app = buildApp();

    const missingKey = await app.inject({
      method: 'POST',
      url: '/api/v1/demo/rides/intents/request',
      payload: {
        pickup: { lat: 17.4435, lng: 78.3772 },
        dropoff: { lat: 17.4502, lng: 78.3808 },
        rideCategory: 'standard'
      }
    });
    expect(missingKey.statusCode).toBe(400);
    expect(missingKey.json()).toMatchObject({ error: { code: 'IDEMPOTENCY_KEY_REQUIRED' } });

    const requested = await app.inject({
      method: 'POST',
      url: '/api/v1/demo/rides/intents/request',
      headers: { 'idempotency-key': 'ownership-test-123', 'x-demo-rider-id': 'rider-a' },
      payload: {
        pickup: { lat: 17.4435, lng: 78.3772 },
        dropoff: { lat: 17.4502, lng: 78.3808 },
        rideCategory: 'accessible'
      }
    });
    const rideId = requested.json().rideId;

    const status = await app.inject({
      method: 'GET',
      url: `/api/v1/demo/rides/${rideId}/status`,
      headers: { 'x-demo-rider-id': 'rider-b' }
    });
    expect(status.statusCode).toBe(403);
    expect(status.json()).toMatchObject({ error: { code: 'FORBIDDEN' } });

    await app.close();
  });

  it('blocks generic live dispatch in a demo build', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/rides/intents/request',
      headers: { 'idempotency-key': 'live-guard-test-123' },
      payload: {
        pickup: { lat: 17.4435, lng: 78.3772 },
        dropoff: { lat: 17.4502, lng: 78.3808 },
        rideCategory: 'standard'
      }
    });
    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ error: { code: 'LIVE_DISPATCH_DISABLED' } });
    await app.close();
  });

  it('returns a safe 404 envelope instead of leaking internals', async () => {
    const app = buildApp();

    const response = await app.inject({ method: 'POST', url: '/api/v1/me' });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found',
        requestId: expect.any(String)
      }
    });

    await app.close();
  });
});
