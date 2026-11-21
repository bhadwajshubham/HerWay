import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { createHash } from 'node:crypto';
import { FareEstimateRequestSchema, FareEstimateResponseSchema } from '@herway/shared';
import { config, liveDispatchEnabled } from '../config.js';
import { demoRepository } from '../repositories/demo.js';
import { estimateFareInr, HERWAY_RATE_PER_KM_INR } from '../domain/fare.js';
import { getRouteDistanceKm, RouteDistanceUnavailableError } from '../domain/route-distance.js';

const RideRequestSchema = z.object({
  pickup: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }),
  dropoff: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }),
  rideCategory: z.enum(['standard', 'premium', 'accessible'])
}).strict();

const CancelRequestSchema = z.object({
  rideId: z.string().min(1).max(128).optional(),
  reason: z
    .enum(['changed_mind', 'waited_too_long', 'safety_concern', 'other'])
    .default('changed_mind')
}).strict();

const SOSRequestSchema = z.object({
  rideId: z.string().min(1).max(128),
  intent: z.literal('ACTIVATE_SOS_OVERLAY')
}).strict();

const idempotentResponses = new Map<
  string,
  { statusCode: number; body: unknown; requestHash: string }
>();

function riderId(request: FastifyRequest): string {
  const value = request.headers['x-demo-rider-id'];
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim().slice(0, 128)
    : 'demo-rider';
}

function requireIdempotency(
  request: FastifyRequest,
  reply: { status(code: number): { send(payload: unknown): unknown } }
): string | null {
  const key =
    typeof request.headers['idempotency-key'] === 'string'
      ? request.headers['idempotency-key'].trim().slice(0, 128)
      : '';
  if (key.length < 8) {
    reply.status(400).send({
      error: {
        code: 'IDEMPOTENCY_KEY_REQUIRED',
        message: 'Idempotency-Key header is required',
        requestId: request.id
      }
    });
    return null;
  }
  return key;
}

function replayKey(request: FastifyRequest, key: string): string {
  return `${request.method}|${request.url}|${key}|${riderId(request)}`;
}

function requestHash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function validationError(request: FastifyRequest, message: string) {
  return {
    error: { code: 'VALIDATION_ERROR', message, requestId: request.id }
  };
}

export function registerDemoRoutes(app: FastifyInstance): void {
  const liveFeatureBlocked = async (
    request: FastifyRequest,
    reply: import('fastify').FastifyReply
  ) => reply.status(501).send({
    error: {
      code: 'LIVE_FEATURE_DISABLED',
      message: 'Live matching, dispatch, and payments are not implemented in this release',
      requestId: request.id
    }
  });
  app.post('/api/v1/rides/intents/match', liveFeatureBlocked);
  app.post('/api/v1/rides/intents/dispatch', liveFeatureBlocked);
  app.post('/api/v1/rides/intents/accept', liveFeatureBlocked);
  app.all('/api/v1/payments/*', liveFeatureBlocked);

  const estimate = async (request: FastifyRequest, reply: import('fastify').FastifyReply) => {
    const parsed = FareEstimateRequestSchema.safeParse(request.body);
    if (!parsed.success)
      return reply.status(400).send(validationError(request, 'Invalid fare estimate request'));

    let routeDistance: Awaited<ReturnType<typeof getRouteDistanceKm>>;
    try {
      routeDistance = await getRouteDistanceKm(parsed.data, {
        apiKey: config.GOOGLE_MAPS_ROUTES_API_KEY,
        allowDemoFallback: config.NODE_ENV !== 'production'
      });
    } catch (error) {
      if (error instanceof RouteDistanceUnavailableError) {
        return reply.status(503).send({
          error: {
            code: 'ROUTE_DISTANCE_UNAVAILABLE',
            message: 'A route fare estimate is temporarily unavailable. Please retry shortly.',
            requestId: request.id
          }
        });
      }
      throw error;
    }
    const distanceKm = Math.round(routeDistance.distanceKm * 1000) / 1000;
    const estimatedAmount = estimateFareInr(distanceKm);
    const body = FareEstimateResponseSchema.parse({
      amountMin: estimatedAmount,
      amountMax: estimatedAmount,
      distanceKm,
      ratePerKm: HERWAY_RATE_PER_KM_INR,
      currency: 'INR',
      validitySeconds: 300,
      explanation:
        routeDistance.source === 'google_routes'
          ? 'Estimate uses Google road-route distance at ₹11 per km; final fare may change if the route changes'
          : 'Demo estimate uses great-circle distance at ₹11 per km; actual road distance and availability are not included'
    });
    return reply.send({
      ...body,
      demo: true,
      mode: 'demo',
      liveDispatchEnabled: liveDispatchEnabled()
    });
  };

  app.post('/api/v1/fares/estimate', estimate);
  app.post('/api/v1/fare/estimate', estimate);
  app.post('/api/v1/demo/fares/estimate', estimate);
  app.post('/api/v1/demo/fare/estimate', estimate);

  const requestRide = async (request: FastifyRequest, reply: import('fastify').FastifyReply) => {
    const key = requireIdempotency(request, reply);
    if (!key) return;
    const parsed = RideRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(validationError(request, 'Invalid demo ride request'));
    }
    const hash = requestHash(parsed.data);
    const prior = idempotentResponses.get(replayKey(request, key));
    if (prior) {
      if (prior.requestHash !== hash) {
        return reply.status(409).send({
          error: {
            code: 'IDEMPOTENCY_KEY_REUSED',
            message: 'Idempotency key was reused with different request data',
            requestId: request.id
          }
        });
      }
      return reply.status(prior.statusCode).send(prior.body);
    }

    const ride = demoRepository.createRide({
      riderId: riderId(request),
      pickup: parsed.data.pickup,
      dropoff: parsed.data.dropoff,
      rideCategory: parsed.data.rideCategory
    });
    demoRepository.recordAudit({
      action: 'demo.ride.request',
      targetType: 'ride',
      targetId: ride.rideId,
      riderId: riderId(request),
      idempotencyKey: key,
      outcome: 'success'
    });
    const body = {
      ...ride,
      demo: true,
      mode: 'demo',
      payment: 'NOT_REQUESTED',
      liveDispatchEnabled: liveDispatchEnabled(),
      message: 'Demo ride created in memory; no captain was contacted and no payment was taken'
    };
    idempotentResponses.set(replayKey(request, key), {
      statusCode: 201,
      body,
      requestHash: hash
    });
    return reply.status(201).send(body);
  };

  app.post('/api/v1/rides/intents/request', async (request, reply) => {
    if (!liveDispatchEnabled()) {
      return reply.status(409).send({
        error: {
          code: 'LIVE_DISPATCH_DISABLED',
          message: 'Live dispatch is disabled because production ride services are not implemented',
          requestId: request.id
        }
      });
    }
    if (config.APP_MODE === 'live') {
      return reply.status(501).send({
        error: {
          code: 'LIVE_DISPATCH_NOT_IMPLEMENTED',
          message: 'Live matching and dispatch are not implemented in this demo build',
          requestId: request.id
        }
      });
    }
    return requestRide(request, reply);
  });
  app.post('/api/v1/demo/rides/intents/request', requestRide);
  app.post('/api/v1/demo/rides/request', requestRide);

  const cancelRide = async (request: FastifyRequest, reply: import('fastify').FastifyReply) => {
    const key = requireIdempotency(request, reply);
    if (!key) return;
    const parsed = CancelRequestSchema.safeParse(request.body);
    if (!parsed.success)
      return reply.status(400).send(validationError(request, 'Invalid demo cancellation request'));
    const hash = requestHash(parsed.data);
    const prior = idempotentResponses.get(replayKey(request, key));
    if (prior) {
      if (prior.requestHash !== hash) {
        return reply.status(409).send({
          error: {
            code: 'IDEMPOTENCY_KEY_REUSED',
            message: 'Idempotency key was reused with different request data',
            requestId: request.id
          }
        });
      }
      return reply.status(prior.statusCode).send(prior.body);
    }
    const params = request.params as { rideId?: string };
    const rideId = params.rideId ?? parsed.data.rideId;
    if (!rideId) return reply.status(400).send(validationError(request, 'rideId is required'));

    const ride = demoRepository.getRide(rideId);
    if (!ride)
      return reply.status(404).send({
        error: {
          code: 'DEMO_RIDE_NOT_FOUND',
          message: 'Demo ride not found',
          requestId: request.id
        }
      });
    if (ride.riderId !== riderId(request))
      return reply.status(403).send({
        error: {
          code: 'FORBIDDEN',
          message: 'Demo ride belongs to another rider',
          requestId: request.id
        }
      });

    const cancelled = demoRepository.cancelRide(rideId);
    demoRepository.recordAudit({
      action: 'demo.ride.cancel',
      targetType: 'ride',
      targetId: rideId,
      riderId: riderId(request),
      idempotencyKey: key,
      outcome: 'success'
    });
    const body = {
      ...cancelled,
      reason: parsed.data.reason,
      demo: true,
      mode: 'demo',
      liveDispatchEnabled: liveDispatchEnabled()
    };
    idempotentResponses.set(replayKey(request, key), {
      statusCode: 200,
      body,
      requestHash: hash
    });
    return reply.status(200).send(body);
  };

  app.post('/api/v1/demo/rides/intents/cancel', cancelRide);
  app.post('/api/v1/demo/rides/:rideId/intents/cancel', cancelRide);
  app.post('/api/v1/demo/rides/:rideId/cancel', cancelRide);
  app.post('/api/v1/rides/:rideId/intents/cancel', cancelRide);

  const getRideStatus = async (request: FastifyRequest, reply: import('fastify').FastifyReply) => {
    const rideId = (request.params as { rideId: string }).rideId;
    const ride = demoRepository.getRide(rideId);
    if (!ride)
      return reply.status(404).send({
        error: {
          code: 'DEMO_RIDE_NOT_FOUND',
          message: 'Demo ride not found',
          requestId: request.id
        }
      });
    if (ride.riderId !== riderId(request))
      return reply.status(403).send({
        error: {
          code: 'FORBIDDEN',
          message: 'Demo ride belongs to another rider',
          requestId: request.id
        }
      });
    return reply.send({
      ...ride,
      demo: true,
      mode: 'demo',
      liveDispatchEnabled: liveDispatchEnabled()
    });
  };

  app.get('/api/v1/demo/rides/:rideId/status', getRideStatus);
  app.get('/api/v1/rides/:rideId/status', getRideStatus);

  const activateSOS = async (request: FastifyRequest, reply: import('fastify').FastifyReply) => {
    const key = requireIdempotency(request, reply);
    if (!key) return;
    const parsed = SOSRequestSchema.safeParse(request.body);
    if (!parsed.success)
      return reply.status(400).send(validationError(request, 'Invalid SOS overlay intent'));
    const hash = requestHash(parsed.data);
    const prior = idempotentResponses.get(replayKey(request, key));
    if (prior) {
      if (prior.requestHash !== hash) {
        return reply.status(409).send({
          error: {
            code: 'IDEMPOTENCY_KEY_REUSED',
            message: 'Idempotency key was reused with different request data',
            requestId: request.id
          }
        });
      }
      return reply.status(prior.statusCode).send(prior.body);
    }
    const ride = demoRepository.getRide(parsed.data.rideId);
    if (!ride)
      return reply.status(404).send({
        error: {
          code: 'DEMO_RIDE_NOT_FOUND',
          message: 'Demo ride not found',
          requestId: request.id
        }
      });
    if (ride.riderId !== riderId(request))
      return reply.status(403).send({
        error: {
          code: 'FORBIDDEN',
          message: 'Demo ride belongs to another rider',
          requestId: request.id
        }
      });

    const sos = demoRepository.createSOS({ rideId: ride.rideId, riderId: riderId(request) });
    demoRepository.recordAudit({
      action: 'demo.sos.overlay.activate',
      targetType: 'sos',
      targetId: sos.sosId,
      riderId: riderId(request),
      idempotencyKey: key,
      outcome: 'success'
    });
    const body = {
      ...sos,
      rideState: ride.state,
      demo: true,
      mode: 'demo',
      liveDispatchEnabled: liveDispatchEnabled(),
      overlay: 'ACTIVE',
      emergencyServicesContacted: false,
      message: 'Demo SOS overlay only; no emergency service or real person was contacted'
    };
    idempotentResponses.set(replayKey(request, key), {
      statusCode: 201,
      body,
      requestHash: hash
    });
    return reply.status(201).send(body);
  };

  app.post('/api/v1/demo/sos/intents/activate', activateSOS);
  app.post('/api/v1/demo/sos/activate', activateSOS);
  app.post('/api/v1/sos/intents/activate', activateSOS);
  app.post('/api/v1/demo/rides/:rideId/intents/sos/activate', async (request, reply) => {
    const rideId = (request.params as { rideId: string }).rideId;
    const body = request.body;
    if (typeof body === 'object' && body !== null && !('rideId' in body)) {
      request.body = { ...(body as Record<string, unknown>), rideId };
    }
    return activateSOS(request, reply);
  });
  app.post('/api/v1/demo/rides/:rideId/sos', async (request, reply) => {
    const rideId = (request.params as { rideId: string }).rideId;
    const body = request.body;
    if (typeof body === 'object' && body !== null) {
      const source = body as Record<string, unknown>;
      request.body = { rideId, intent: 'ACTIVATE_SOS_OVERLAY', ...source };
    } else {
      request.body = { rideId, intent: 'ACTIVATE_SOS_OVERLAY' };
    }
    return activateSOS(request, reply);
  });
}
