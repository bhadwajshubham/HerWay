import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Timestamp } from 'firebase-admin/firestore';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import {
  CircleCreateRequestSchema,
  CircleReviewRequestSchema,
  CloudinaryUploadSignatureRequestSchema,
  CloudinaryUploadSignatureResponseSchema,
  ConsentRequestSchema,
  EmergencyContactRequestSchema,
  FcmDeviceRegistrationSchema,
  FirebaseAuthVerifyRequestSchema,
  OnboardingCompleteRequestSchema,
  ProfileUpsertRequestSchema,
  ScheduledRideRequestSchema,
  ScheduledRideResponseSchema,
  ScheduledRideListResponseSchema,
  ScheduledRideCancellationResponseSchema
} from '@herway/shared';
import { FirebaseAuthUnavailableError, createFirebaseTokenVerifier } from '../auth/firebase.js';
import { firestore } from '../repositories/firestore.js';
import { config } from '../config.js';
import { estimateFareInr, HERWAY_RATE_PER_KM_INR } from '../domain/fare.js';
import { getRouteDistanceKm, RouteDistanceUnavailableError } from '../domain/route-distance.js';
import { validateScheduledAt } from '../domain/scheduled-ride.js';

interface AuthenticatedIdentity {
  firebaseUid: string;
  phoneVerified: boolean;
  roles: string[];
}

function idempotencyKey(request: FastifyRequest): string {
  const value = request.headers['idempotency-key'];
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  return trimmed.length >= 8 && trimmed.length <= 128 ? trimmed : '';
}

async function requireIdempotency(request: FastifyRequest): Promise<string> {
  const key = idempotencyKey(request);
  if (!key) {
    throw Object.assign(new Error('Idempotency-Key header is required'), {
      statusCode: 400,
      code: 'IDEMPOTENCY_KEY_REQUIRED'
    });
  }
  return key;
}

async function authenticate(request: FastifyRequest): Promise<AuthenticatedIdentity> {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    throw Object.assign(new Error('Authentication required'), {
      statusCode: 401,
      code: 'UNAUTHORIZED'
    });
  }

  try {
    const decoded = await createFirebaseTokenVerifier().verifyIdToken(
      authorization.slice('Bearer '.length)
    );
    return {
      firebaseUid: decoded.uid,
      phoneVerified: decoded.phone_number !== undefined,
      roles: Array.isArray(decoded.roles)
        ? decoded.roles.filter((role): role is string => typeof role === 'string')
        : []
    };
  } catch (error) {
    if (error instanceof FirebaseAuthUnavailableError) {
      throw Object.assign(error, { statusCode: 503, code: 'AUTH_UNAVAILABLE' });
    }
    throw Object.assign(new Error('Invalid or expired Firebase token'), {
      statusCode: 401,
      code: 'UNAUTHORIZED'
    });
  }
}

function requireCircleReviewer(identity: AuthenticatedIdentity): void {
  if (!identity.roles.includes('operator') && !identity.roles.includes('admin')) {
    throw Object.assign(new Error('Operator or admin role required'), {
      statusCode: 403,
      code: 'FORBIDDEN'
    });
  }
}

function idempotencyDocumentId(actorId: string, request: FastifyRequest, key: string): string {
  return createHash('sha256')
    .update(`${actorId}|${request.method}|${request.url}|${key}`)
    .digest('hex');
}

async function claimIdempotentResponse(
  actorId: string,
  request: FastifyRequest,
  key: string,
  requestBody: unknown = request.body
): Promise<{ status: number; body: unknown } | null> {
  const db = firestore();
  const reference = db.collection('idempotency').doc(idempotencyDocumentId(actorId, request, key));
  const requestHash = createHash('sha256').update(JSON.stringify(requestBody)).digest('hex');

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (snapshot.exists) {
      const record = snapshot.data();
      if (record?.state === 'completed') {
        if (record.requestHash && record.requestHash !== requestHash) {
          throw Object.assign(new Error('Idempotency key was reused with different request data'), {
            statusCode: 409,
            code: 'IDEMPOTENCY_KEY_REUSED'
          });
        }
        return { status: record.responseStatus as number, body: record.responseBody };
      }
      const expiresAt = record?.expiresAt as Timestamp | undefined;
      if (record?.state === 'in_progress' && expiresAt && expiresAt.toMillis() <= Date.now()) {
        transaction.delete(reference);
      } else {
        throw Object.assign(new Error('The idempotent operation is already in progress'), {
          statusCode: 409,
          code: 'IDEMPOTENCY_IN_PROGRESS'
        });
      }
    }

    transaction.set(reference, {
      actorId,
      method: request.method,
      path: request.url,
      key,
      requestHash,
      state: 'in_progress',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });
    return null;
  });
}

async function completeIdempotentResponse(
  actorId: string,
  request: FastifyRequest,
  key: string,
  status: number,
  body: unknown,
  requestBody: unknown = request.body
): Promise<void> {
  const reference = firestore()
    .collection('idempotency')
    .doc(idempotencyDocumentId(actorId, request, key));
  const requestHash = createHash('sha256').update(JSON.stringify(requestBody)).digest('hex');
  await reference.set(
    {
      actorId,
      method: request.method,
      path: request.url,
      key,
      requestHash,
      state: 'completed',
      responseStatus: status,
      responseBody: body,
      completedAt: new Date()
    },
    { merge: true }
  );
}

async function recordAudit(
  actorId: string,
  action: string,
  targetType: string,
  targetId: string,
  requestId: string,
  key: string,
  outcome: 'success' | 'failure'
): Promise<void> {
  await firestore().collection('audit').add({
    actorId,
    action,
    targetType,
    targetId,
    requestId,
    idempotencyKey: key,
    outcome,
    createdAt: new Date()
  });
}

export function registerPhase1Routes(app: FastifyInstance): void {
  app.post(
    '/api/v1/scheduled-rides/requests',
    { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (request, reply) => {
    const identity = await authenticate(request);
    const key = await requireIdempotency(request);
    const parsed = ScheduledRideRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid scheduled ride request',
          requestId: request.id
        }
      });
    }

    const scheduleValidation = validateScheduledAt(parsed.data.scheduledAt, Date.now());
    if (!scheduleValidation.ok) {
      const reason = scheduleValidation.reason;
      return reply.status(400).send({
        error: {
          code: reason === 'TOO_FAR' ? 'SCHEDULE_TOO_FAR' : 'SCHEDULE_TOO_SOON',
          message:
            reason === 'TOO_FAR'
              ? 'Choose a pickup time within the next 30 days.'
              : 'Choose a pickup time at least 30 minutes from now.',
          requestId: request.id
        }
      });
    }

    const db = firestore();
    const now = new Date();
    const normalizedRequest = { ...parsed.data, scheduledAt: scheduleValidation.scheduledAt.toISOString() };
    const requestHash = createHash('sha256').update(JSON.stringify(normalizedRequest)).digest('hex');
    const idempotencyReference = db
      .collection('idempotency')
      .doc(idempotencyDocumentId(identity.firebaseUid, request, key));
    const priorSnapshot = await idempotencyReference.get();
    if (priorSnapshot.exists) {
      const prior = priorSnapshot.data();
      if (prior?.state === 'completed') {
        if (prior.requestHash !== requestHash) {
          return reply.status(409).send({
            error: {
              code: 'IDEMPOTENCY_KEY_REUSED',
              message: 'Idempotency key was reused with different request data',
              requestId: request.id
            }
          });
        }
        return reply.status(prior.responseStatus as number).send(prior.responseBody);
      }
      return reply.status(409).send({
        error: {
          code: 'IDEMPOTENCY_IN_PROGRESS',
          message: 'The idempotent operation is already in progress',
          requestId: request.id
        }
      });
    }

    let routeDistance: Awaited<ReturnType<typeof getRouteDistanceKm>>;
    try {
      routeDistance = await getRouteDistanceKm(parsed.data, {
        apiKey: config.GOOGLE_MAPS_ROUTES_API_KEY,
        allowDemoFallback: false
      });
    } catch (error) {
      if (error instanceof RouteDistanceUnavailableError) {
        return reply.status(503).send({
          error: {
            code: 'ROUTE_DISTANCE_UNAVAILABLE',
            message: 'We could not calculate the route fare. Please retry shortly.',
            requestId: request.id
          }
        });
      }
      throw error;
    }

    const scheduledRideReference = db.collection('scheduledRideRequests').doc();
    const auditReference = db.collection('audit').doc();
    const distanceKm = Math.round(routeDistance.distanceKm * 1000) / 1000;
    const responseBody = ScheduledRideResponseSchema.parse({
      requestId: scheduledRideReference.id,
      scheduledAt: scheduleValidation.scheduledAt.toISOString(),
      status: 'AWAITING_OPERATOR_CONFIRMATION',
      bookingConfirmed: false,
      estimatedFareInr: estimateFareInr(distanceKm),
      distanceKm,
      ratePerKm: HERWAY_RATE_PER_KM_INR,
      womenCaptainOnly: true,
      message:
        'Your request is stored but cannot be confirmed or dispatched by this app version. This is not a booking.'
    });

    const result = await db.runTransaction(async (transaction) => {
      const idempotencySnapshot = await transaction.get(idempotencyReference);
      if (idempotencySnapshot.exists) {
        const prior = idempotencySnapshot.data();
        if (prior?.state === 'completed') {
          if (prior.requestHash !== requestHash) {
            throw Object.assign(new Error('Idempotency key was reused with different request data'), {
              statusCode: 409,
              code: 'IDEMPOTENCY_KEY_REUSED'
            });
          }
          return { status: prior.responseStatus as number, body: prior.responseBody };
        }
        throw Object.assign(new Error('The idempotent operation is already in progress'), {
          statusCode: 409,
          code: 'IDEMPOTENCY_IN_PROGRESS'
        });
      }

      transaction.create(scheduledRideReference, {
        riderId: identity.firebaseUid,
        pickup: parsed.data.pickup,
        dropoff: parsed.data.dropoff,
        rideCategory: parsed.data.rideCategory,
        scheduledAt: scheduleValidation.scheduledAt,
        expiresAt: new Date(scheduleValidation.scheduledAt.getTime() + 7 * 24 * 60 * 60 * 1000),
        routeDistanceKm: distanceKm,
        ratePerKm: HERWAY_RATE_PER_KM_INR,
        womenCaptainOnly: true,
        estimatedFareInr: estimateFareInr(distanceKm),
        locationUseConsent: true,
        locationUseConsentVersion: 'scheduled-request-v1',
        routeProvider: 'google_routes',
        status: 'AWAITING_OPERATOR_CONFIRMATION',
        bookingConfirmed: false,
        createdAt: now,
        updatedAt: now
      });
      transaction.create(idempotencyReference, {
        actorId: identity.firebaseUid,
        method: request.method,
        path: request.url,
        key,
        requestHash,
        state: 'completed',
        responseStatus: 202,
        responseBody,
        createdAt: now,
        completedAt: now
      });
      transaction.create(auditReference, {
        actorId: identity.firebaseUid,
        action: 'scheduled_ride.request',
        targetType: 'scheduled_ride_request',
        targetId: scheduledRideReference.id,
        requestId: request.id,
        idempotencyKey: key,
        outcome: 'success',
        createdAt: now
      });
      return { status: 202, body: responseBody };
    });

    return reply.status(result.status).send(result.body);
    }
  );

  app.get('/api/v1/scheduled-rides/requests', async (request) => {
    const identity = await authenticate(request);
    const snapshot = await firestore()
      .collection('scheduledRideRequests')
      .where('riderId', '==', identity.firebaseUid)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();
    return ScheduledRideListResponseSchema.parse({
      requests: snapshot.docs.map((document) => ({
        requestId: document.id,
        pickup: document.get('pickup'),
        dropoff: document.get('dropoff'),
        scheduledAt: (document.get('scheduledAt') as Timestamp).toDate().toISOString(),
        status: document.get('status'),
        bookingConfirmed: document.get('bookingConfirmed') === true,
        estimatedFareInr: document.get('estimatedFareInr'),
        distanceKm: Number(document.get('routeDistanceKm')),
        ratePerKm: HERWAY_RATE_PER_KM_INR,
        womenCaptainOnly: true
      }))
    });
  });

  app.post('/api/v1/scheduled-rides/requests/:requestId/cancel', async (request, reply) => {
    const identity = await authenticate(request);
    const key = await requireIdempotency(request);
    const parsedParams = z.object({ requestId: z.string().min(1).max(128) }).safeParse(request.params);
    if (!parsedParams.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid scheduled ride request ID',
          requestId: request.id
        }
      });
    }

    const db = firestore();
    const scheduledRideReference = db
      .collection('scheduledRideRequests')
      .doc(parsedParams.data.requestId);
    const idempotencyReference = db
      .collection('idempotency')
      .doc(idempotencyDocumentId(identity.firebaseUid, request, key));
    const auditReference = db.collection('audit').doc();
    const now = new Date();
    const result = await db.runTransaction(async (transaction) => {
      const idempotencySnapshot = await transaction.get(idempotencyReference);
      if (idempotencySnapshot.exists) {
        const record = idempotencySnapshot.data();
        if (record?.state === 'completed') {
          return { status: record.responseStatus as number, body: record.responseBody };
        }
        throw Object.assign(new Error('The idempotent operation is already in progress'), {
          statusCode: 409,
          code: 'IDEMPOTENCY_IN_PROGRESS'
        });
      }

      const scheduledRideSnapshot = await transaction.get(scheduledRideReference);
      if (!scheduledRideSnapshot.exists || scheduledRideSnapshot.get('riderId') !== identity.firebaseUid) {
        throw Object.assign(new Error('Scheduled ride request not found'), {
          statusCode: 404,
          code: 'SCHEDULED_RIDE_NOT_FOUND'
        });
      }
      if (scheduledRideSnapshot.get('status') !== 'AWAITING_OPERATOR_CONFIRMATION') {
        throw Object.assign(new Error('This scheduled ride request can no longer be cancelled'), {
          statusCode: 409,
          code: 'SCHEDULED_RIDE_NOT_CANCELLABLE'
        });
      }

      const responseBody = ScheduledRideCancellationResponseSchema.parse({
        requestId: scheduledRideReference.id,
        status: 'CANCELLED' as const,
        bookingConfirmed: false as const
      });
      transaction.update(scheduledRideReference, {
        status: 'CANCELLED',
        updatedAt: now,
        cancelledAt: now
      });
      transaction.create(idempotencyReference, {
        actorId: identity.firebaseUid,
        method: request.method,
        path: request.url,
        key,
        state: 'completed',
        responseStatus: 200,
        responseBody,
        createdAt: now,
        completedAt: now
      });
      transaction.create(auditReference, {
        actorId: identity.firebaseUid,
        action: 'scheduled_ride.cancel',
        targetType: 'scheduled_ride_request',
        targetId: scheduledRideReference.id,
        requestId: request.id,
        idempotencyKey: key,
        outcome: 'success',
        createdAt: now
      });
      return { status: 200, body: responseBody };
    });

    return reply.status(result.status).send(result.body);
  });

  app.post('/api/v1/onboarding/complete', async (request, reply) => {
    const identity = await authenticate(request);
    const key = await requireIdempotency(request);
    const parsed = OnboardingCompleteRequestSchema.safeParse(request.body);
    if (
      !parsed.success ||
      parsed.data.consent.purpose !== 'service_account' ||
      parsed.data.consent.status !== 'granted'
    ) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid onboarding completion request',
          requestId: request.id
        }
      });
    }

    const db = firestore();
    const now = new Date();
    const idempotencyReference = db
      .collection('idempotency')
      .doc(idempotencyDocumentId(identity.firebaseUid, request, key));
    const userReference = db.collection('users').doc(identity.firebaseUid);
    const contactReference = db.collection('emergencyContacts').doc();
    const consentReference = db.collection('consents').doc();
    const auditReference = db.collection('audit').doc();
    const primaryContacts = db
      .collection('emergencyContacts')
      .where('firebaseUid', '==', identity.firebaseUid)
      .where('isPrimary', '==', true);

    const result = await db.runTransaction(async (transaction) => {
      const idempotencySnapshot = await transaction.get(idempotencyReference);
      if (idempotencySnapshot.exists) {
        const record = idempotencySnapshot.data();
        if (record?.state === 'completed') {
          return { status: record.responseStatus as number, body: record.responseBody };
        }
        throw Object.assign(new Error('The idempotent operation is already in progress'), {
          statusCode: 409,
          code: 'IDEMPOTENCY_IN_PROGRESS'
        });
      }

      const userSnapshot = await transaction.get(userReference);
      if (!userSnapshot.exists) {
        throw Object.assign(new Error('Complete Firebase verification first'), {
          statusCode: 404,
          code: 'USER_NOT_FOUND'
        });
      }
      const primarySnapshot = await transaction.get(primaryContacts);
      const body = {
        firebaseUid: identity.firebaseUid,
        displayName: parsed.data.profile.displayName,
        preferredLanguage: parsed.data.profile.preferredLanguage,
        emergencyContact: {
          contactId: contactReference.id,
          displayName: parsed.data.emergencyContact.displayName,
          relationship: parsed.data.emergencyContact.relationship,
          isPrimary: true
        },
        consent: {
          consentId: consentReference.id,
          purpose: parsed.data.consent.purpose,
          consentVersion: parsed.data.consent.consentVersion,
          status: parsed.data.consent.status
        }
      };

      for (const document of primarySnapshot.docs) {
        transaction.update(document.ref, { isPrimary: false, updatedAt: now });
      }
      transaction.set(userReference, { ...parsed.data.profile, updatedAt: now }, { merge: true });
      transaction.create(consentReference, {
        firebaseUid: identity.firebaseUid,
        ...parsed.data.consent,
        grantedAt: now,
        revokedAt: null,
        createdAt: now
      });
      transaction.create(contactReference, {
        firebaseUid: identity.firebaseUid,
        ...parsed.data.emergencyContact,
        createdAt: now,
        updatedAt: now
      });
      transaction.create(idempotencyReference, {
        actorId: identity.firebaseUid,
        method: request.method,
        path: request.url,
        key,
        state: 'completed',
        responseStatus: 200,
        responseBody: body,
        createdAt: now,
        completedAt: now
      });
      transaction.create(auditReference, {
        actorId: identity.firebaseUid,
        action: 'onboarding.complete',
        targetType: 'user',
        targetId: identity.firebaseUid,
        requestId: request.id,
        idempotencyKey: key,
        outcome: 'success',
        createdAt: now
      });
      return { status: 200, body };
    });

    return reply.status(result.status).send(result.body);
  });

  app.get('/api/v1/me', async (request, reply) => {
    const identity = await authenticate(request);
    const snapshot = await firestore().collection('users').doc(identity.firebaseUid).get();
    if (!snapshot.exists) {
      return reply.status(404).send({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Complete Firebase verification first',
          requestId: request.id
        }
      });
    }
    const user = snapshot.data();
    return {
      firebaseUid: identity.firebaseUid,
      displayName: user?.displayName ?? null,
      preferredLanguage: user?.preferredLanguage ?? 'en',
      accessibilityPreferences: user?.accessibilityPreferences ?? [],
      photoUrl: user?.photoUrl ?? null
    };
  });

  app.post('/api/v1/auth/firebase/verify', async (request, reply) => {
    const key = await requireIdempotency(request);
    const parsed = FirebaseAuthVerifyRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid Firebase verification request',
          requestId: request.id
        }
      });
    }

    let decoded;
    try {
      decoded = await createFirebaseTokenVerifier().verifyIdToken(parsed.data.idToken);
    } catch (error) {
      if (error instanceof FirebaseAuthUnavailableError) {
        return reply.status(503).send({
          error: {
            code: 'AUTH_UNAVAILABLE',
            message: 'Firebase Authentication is unavailable',
            requestId: request.id
          }
        });
      }
      return reply.status(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired Firebase token',
          requestId: request.id
        }
      });
    }

    const prior = await claimIdempotentResponse(decoded.uid, request, key);
    if (prior) return reply.status(prior.status).send(prior.body);

    const db = firestore();
    const userReference = db.collection('users').doc(decoded.uid);
    const snapshot = await userReference.get();
    const existing = snapshot.exists ? snapshot.data() : undefined;
    const user = {
      firebaseUid: decoded.uid,
      email: decoded.email ?? existing?.email ?? null,
      photoUrl: decoded.picture ?? existing?.photoUrl ?? null,
      phone: decoded.phone_number ?? existing?.phone ?? null,
      displayName: existing?.displayName ?? null,
      preferredLanguage: existing?.preferredLanguage ?? 'en',
      accessibilityPreferences: existing?.accessibilityPreferences ?? [],
      deletionState: existing?.deletionState ?? 'active'
    };
    await userReference.set(
      { ...user, updatedAt: new Date(), createdAt: existing?.createdAt ?? new Date() },
      { merge: true }
    );

    const body = {
      firebaseUid: decoded.uid,
      phoneVerified: decoded.phone_number !== undefined,
      emailVerified: decoded.email_verified === true
    };
    await completeIdempotentResponse(decoded.uid, request, key, 200, body);
    await recordAudit(
      decoded.uid,
      'auth.firebase.verify',
      'user',
      decoded.uid,
      request.id,
      key,
      'success'
    );
    return body;
  });

  app.patch('/api/v1/me', async (request, reply) => {
    const identity = await authenticate(request);
    const key = await requireIdempotency(request);
    const parsed = ProfileUpsertRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid profile request',
          requestId: request.id
        }
      });
    }

    const prior = await claimIdempotentResponse(identity.firebaseUid, request, key);
    if (prior) return reply.status(prior.status).send(prior.body);

    const db = firestore();
    const userReference = db.collection('users').doc(identity.firebaseUid);
    const snapshot = await userReference.get();
    if (!snapshot.exists) {
      return reply.status(404).send({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Complete Firebase verification first',
          requestId: request.id
        }
      });
    }

    await userReference.set({ ...parsed.data, updatedAt: new Date() }, { merge: true });
    const body = { firebaseUid: identity.firebaseUid, ...parsed.data };
    await completeIdempotentResponse(identity.firebaseUid, request, key, 200, body);
    await recordAudit(
      identity.firebaseUid,
      'user.profile.update',
      'user',
      identity.firebaseUid,
      request.id,
      key,
      'success'
    );
    return body;
  });

  app.post('/api/v1/consents', async (request, reply) => {
    const identity = await authenticate(request);
    const key = await requireIdempotency(request);
    const parsed = ConsentRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid consent request',
          requestId: request.id
        }
      });
    }

    const prior = await claimIdempotentResponse(identity.firebaseUid, request, key);
    if (prior) return reply.status(prior.status).send(prior.body);

    const db = firestore();
    const consentReference = await db.collection('consents').add({
      firebaseUid: identity.firebaseUid,
      ...parsed.data,
      grantedAt: parsed.data.status === 'granted' ? new Date() : null,
      revokedAt: parsed.data.status === 'revoked' ? new Date() : null,
      createdAt: new Date()
    });
    const body = { consentId: consentReference.id, ...parsed.data };
    await completeIdempotentResponse(identity.firebaseUid, request, key, 201, body);
    await recordAudit(
      identity.firebaseUid,
      'consent.record',
      'consent',
      consentReference.id,
      request.id,
      key,
      'success'
    );
    return reply.status(201).send(body);
  });

  app.post('/api/v1/emergency-contacts', async (request, reply) => {
    const identity = await authenticate(request);
    const key = await requireIdempotency(request);
    const parsed = EmergencyContactRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid emergency contact request',
          requestId: request.id
        }
      });
    }

    const prior = await claimIdempotentResponse(identity.firebaseUid, request, key);
    if (prior) return reply.status(prior.status).send(prior.body);

    const db = firestore();
    if (parsed.data.isPrimary) {
      const primaryContacts = await db
        .collection('emergencyContacts')
        .where('firebaseUid', '==', identity.firebaseUid)
        .where('isPrimary', '==', true)
        .get();
      const batch = db.batch();
      primaryContacts.forEach((document) =>
        batch.update(document.ref, { isPrimary: false, updatedAt: new Date() })
      );
      await batch.commit();
    }

    const reference = await db.collection('emergencyContacts').add({
      firebaseUid: identity.firebaseUid,
      ...parsed.data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    const body = {
      contactId: reference.id,
      displayName: parsed.data.displayName,
      relationship: parsed.data.relationship,
      isPrimary: parsed.data.isPrimary
    };
    await completeIdempotentResponse(identity.firebaseUid, request, key, 201, body);
    await recordAudit(
      identity.firebaseUid,
      'emergency_contact.create',
      'emergency_contact',
      reference.id,
      request.id,
      key,
      'success'
    );
    return reply.status(201).send(body);
  });

  app.post('/api/v1/circles', async (request, reply) => {
    const identity = await authenticate(request);
    const key = await requireIdempotency(request);
    const parsed = CircleCreateRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid circle request',
          requestId: request.id
        }
      });
    }

    const db = firestore();
    const inviteCodeHash = parsed.data.inviteCode
      ? createHash('sha256').update(parsed.data.inviteCode).digest('hex')
      : null;
    const circleReference = db.collection('circles').doc();
    const membershipReference = db.collection('circleMemberships').doc();
    const idempotencyReference = db
      .collection('idempotency')
      .doc(idempotencyDocumentId(identity.firebaseUid, request, key));
    const auditReference = db.collection('audit').doc();
    const now = new Date();

    const result = await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(idempotencyReference);
      if (existing.exists) {
        const record = existing.data();
        if (record?.state === 'completed') {
          return { status: record.responseStatus as number, body: record.responseBody };
        }
        throw Object.assign(new Error('The idempotent operation is already in progress'), {
          statusCode: 409,
          code: 'IDEMPOTENCY_IN_PROGRESS'
        });
      }

      const body = {
        circleId: circleReference.id,
        name: parsed.data.name,
        status: 'pending' as const,
        membershipStatus: 'pending' as const
      };
      transaction.create(circleReference, {
        name: parsed.data.name,
        organizationDomain: parsed.data.organizationDomain ?? null,
        inviteCodeHash,
        ownerFirebaseUid: identity.firebaseUid,
        status: 'pending',
        createdAt: now,
        updatedAt: now
      });
      transaction.create(membershipReference, {
        circleId: circleReference.id,
        firebaseUid: identity.firebaseUid,
        role: 'admin',
        verificationSource: parsed.data.organizationDomain ? 'org_email' : 'invite_code',
        status: 'pending',
        createdAt: now,
        updatedAt: now
      });
      transaction.create(idempotencyReference, {
        actorId: identity.firebaseUid,
        method: request.method,
        path: request.url,
        key,
        state: 'completed',
        responseStatus: 201,
        responseBody: body,
        createdAt: now,
        completedAt: now
      });
      transaction.create(auditReference, {
        actorId: identity.firebaseUid,
        action: 'circle.create_request',
        targetType: 'circle',
        targetId: circleReference.id,
        requestId: request.id,
        idempotencyKey: key,
        outcome: 'success',
        createdAt: now
      });
      return { status: 201, body };
    });

    return reply.status(result.status).send(result.body);
  });

  app.get('/api/v1/consents', async (request) => {
    const identity = await authenticate(request);
    const snapshot = await firestore()
      .collection('consents')
      .where('firebaseUid', '==', identity.firebaseUid)
      .get();
    return {
      consents: snapshot.docs.map((document) => {
        const data = document.data();
        return {
          consentId: document.id,
          purpose: data.purpose,
          consentVersion: data.consentVersion,
          status: data.status
        };
      })
    };
  });

  app.get('/api/v1/emergency-contacts', async (request) => {
    const identity = await authenticate(request);
    const snapshot = await firestore()
      .collection('emergencyContacts')
      .where('firebaseUid', '==', identity.firebaseUid)
      .get();
    return {
      contacts: snapshot.docs.map((document) => {
        const data = document.data();
        return {
          contactId: document.id,
          displayName: data.displayName,
          relationship: data.relationship,
          isPrimary: data.isPrimary
        };
      })
    };
  });

  app.get('/api/v1/circles', async (request) => {
    const identity = await authenticate(request);
    const db = firestore();
    const memberships = await db
      .collection('circleMemberships')
      .where('firebaseUid', '==', identity.firebaseUid)
      .limit(100)
      .get();
    const circleReferences = memberships.docs.map((membership) =>
      db.collection('circles').doc(String(membership.get('circleId')))
    );
    const circleDocuments = circleReferences.length ? await db.getAll(...circleReferences) : [];
    const circles = memberships.docs.flatMap((membership, index) => {
      const circle = circleDocuments[index];
      if (!circle?.exists) return [];
      const circleData = circle.data();
      return [{
        circleId: circle.id,
        name: circleData?.name,
        status: circleData?.status,
        membershipStatus: membership.get('status'),
        role: membership.get('role')
      }];
    });
    return { circles };
  });

  app.get('/api/v1/operations/circles/pending', async (request) => {
    const identity = await authenticate(request);
    requireCircleReviewer(identity);
    const snapshot = await firestore()
      .collection('circles')
      .where('status', '==', 'pending')
      .limit(100)
      .get();
    return {
      circles: snapshot.docs.map((document) => ({
        circleId: document.id,
        name: document.get('name'),
        organizationDomain: document.get('organizationDomain'),
        createdAt: document.get('createdAt')?.toDate?.().toISOString() ?? null
      }))
    };
  });

  app.post('/api/v1/operations/circles/:circleId/review', async (request, reply) => {
    const identity = await authenticate(request);
    requireCircleReviewer(identity);
    const key = await requireIdempotency(request);
    const params = z.object({ circleId: z.string().min(1).max(128) }).safeParse(request.params);
    const parsed = CircleReviewRequestSchema.safeParse(request.body);
    if (!params.success || !parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid Circle review request',
          requestId: request.id
        }
      });
    }

    const db = firestore();
    const circleReference = db.collection('circles').doc(params.data.circleId);
    const idempotencyReference = db
      .collection('idempotency')
      .doc(idempotencyDocumentId(identity.firebaseUid, request, key));
    const auditReference = db.collection('audit').doc();
    const now = new Date();
    const result = await db.runTransaction(async (transaction) => {
      const idempotencySnapshot = await transaction.get(idempotencyReference);
      if (idempotencySnapshot.exists) {
        const record = idempotencySnapshot.data();
        if (record?.state === 'completed') {
          return { status: record.responseStatus as number, body: record.responseBody };
        }
        throw Object.assign(new Error('The idempotent operation is already in progress'), {
          statusCode: 409,
          code: 'IDEMPOTENCY_IN_PROGRESS'
        });
      }

      const circleSnapshot = await transaction.get(circleReference);
      if (!circleSnapshot.exists) {
        throw Object.assign(new Error('Circle request not found'), {
          statusCode: 404,
          code: 'CIRCLE_NOT_FOUND'
        });
      }
      const membershipQuery = db
        .collection('circleMemberships')
        .where('circleId', '==', params.data.circleId)
        .where('status', '==', 'pending');
      const memberships = await transaction.get(membershipQuery);
      if (circleSnapshot.get('status') !== 'pending') {
        throw Object.assign(new Error('Circle request has already been reviewed'), {
          statusCode: 409,
          code: 'CIRCLE_ALREADY_REVIEWED'
        });
      }

      const body = {
        circleId: circleSnapshot.id,
        status: parsed.data.decision
      };
      transaction.update(circleReference, {
        status: parsed.data.decision,
        reviewedBy: identity.firebaseUid,
        reviewedAt: now,
        reviewNote: parsed.data.reviewNote ?? null,
        updatedAt: now
      });
      memberships.docs.forEach((document) =>
        transaction.update(document.ref, {
          status: parsed.data.decision,
          reviewedBy: identity.firebaseUid,
          reviewedAt: now,
          updatedAt: now
        })
      );
      transaction.create(idempotencyReference, {
        actorId: identity.firebaseUid,
        method: request.method,
        path: request.url,
        key,
        state: 'completed',
        responseStatus: 200,
        responseBody: body,
        createdAt: now,
        completedAt: now
      });
      transaction.create(auditReference, {
        actorId: identity.firebaseUid,
        action: `circle.review.${parsed.data.decision}`,
        targetType: 'circle',
        targetId: params.data.circleId,
        requestId: request.id,
        idempotencyKey: key,
        outcome: 'success',
        createdAt: now
      });
      return { status: 200, body };
    });

    return reply.status(result.status).send(result.body);
  });

  app.post('/api/v1/me/photo/upload-signature', async (request, reply) => {
    const identity = await authenticate(request);
    const key = await requireIdempotency(request);
    const parsed = CloudinaryUploadSignatureRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid photo upload request',
          requestId: request.id
        }
      });
    }

    if (
      !config.CLOUDINARY_CLOUD_NAME ||
      !config.CLOUDINARY_API_KEY ||
      !config.CLOUDINARY_API_SECRET
    ) {
      return reply.status(503).send({
        error: {
          code: 'PHOTO_UPLOAD_UNAVAILABLE',
          message: 'Cloudinary photo uploads are not configured',
          requestId: request.id
        }
      });
    }

    const prior = await claimIdempotentResponse(identity.firebaseUid, request, key);
    if (prior) return reply.status(prior.status).send(prior.body);

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `herway/users/${identity.firebaseUid}`;
    const publicId =
      parsed.data.publicId ??
      `profile-${timestamp}-${createHash('sha256').update(identity.firebaseUid).digest('hex').slice(0, 12)}`;
    const signaturePayload = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}`;
    const signature = createHash('sha1')
      .update(`${signaturePayload}${config.CLOUDINARY_API_SECRET}`)
      .digest('hex');
    const body = CloudinaryUploadSignatureResponseSchema.parse({
      cloudName: config.CLOUDINARY_CLOUD_NAME,
      apiKey: config.CLOUDINARY_API_KEY,
      timestamp,
      folder,
      publicId,
      signature
    });

    await completeIdempotentResponse(identity.firebaseUid, request, key, 200, body);
    await recordAudit(
      identity.firebaseUid,
      'profile.photo.upload_signature',
      'user',
      identity.firebaseUid,
      request.id,
      key,
      'success'
    );
    return body;
  });

  app.post('/api/v1/notifications/devices', async (request, reply) => {
    const identity = await authenticate(request);
    const key = await requireIdempotency(request);
    const parsed = FcmDeviceRegistrationSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid notification device request',
          requestId: request.id
        }
      });
    }

    const prior = await claimIdempotentResponse(identity.firebaseUid, request, key);
    if (prior) return reply.status(prior.status).send(prior.body);

    const db = firestore();
    const tokenHash = createHash('sha256').update(parsed.data.token).digest('hex');
    await db.collection('notificationDevices').doc(tokenHash).set(
      {
        firebaseUid: identity.firebaseUid,
        tokenHash,
        platform: parsed.data.platform,
        appVariant: parsed.data.appVariant,
        active: true,
        updatedAt: new Date()
      },
      { merge: true }
    );

    const body = {
      registered: true,
      platform: parsed.data.platform,
      appVariant: parsed.data.appVariant
    };
    await completeIdempotentResponse(identity.firebaseUid, request, key, 201, body);
    await recordAudit(
      identity.firebaseUid,
      'notification_device.register',
      'notification_device',
      tokenHash,
      request.id,
      key,
      'success'
    );
    return reply.status(201).send(body);
  });
}
