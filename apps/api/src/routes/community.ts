import { createHash } from 'node:crypto';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { FirebaseAuthUnavailableError, createFirebaseTokenVerifier } from '../auth/firebase.js';
import { firestore } from '../repositories/firestore.js';
import { AvailableCirclesResponseSchema } from '@herway/shared';

export const CircleParamsSchema = z.object({
  circleId: z.string().trim().min(1).max(128).regex(/^[^/]+$/)
});

export const MembershipRequestBodySchema = z.object({}).strict();

const VerifiedEmailSchema = z.string().trim().email().max(254);
const OrganizationDomainSchema = z.string().trim().min(3).max(253).regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i);
const PublicEmailDomains = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.in', 'outlook.com',
  'hotmail.com', 'hotmail.co.in', 'live.com', 'icloud.com', 'proton.me',
  'protonmail.com', 'rediffmail.com'
]);

interface CommunityIdentity {
  firebaseUid: string;
  email: string | null;
  emailVerified: boolean;
  roles: string[];
}

function requestError(statusCode: number, code: string, message: string): Error & {
  statusCode: number;
  code: string;
} {
  return Object.assign(new Error(message), { statusCode, code });
}

function getIdempotencyKey(request: FastifyRequest): string | null {
  const value = request.headers['idempotency-key'];
  return typeof value === 'string' && value.length >= 8 && value.length <= 128 ? value : null;
}

function hashedId(...parts: string[]): string {
  return createHash('sha256').update(parts.join('|')).digest('hex');
}

function requestFingerprint(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function isPublicEmailDomain(domain: string): boolean {
  const normalized = domain.toLowerCase();
  return [...PublicEmailDomains].some(
    (publicDomain) => normalized === publicDomain || normalized.endsWith(`.${publicDomain}`)
  );
}

export function isVerifiedOrganizationEmail(
  email: string,
  emailVerified: boolean,
  organizationDomain: string
): boolean {
  if (!emailVerified) return false;
  const parsedEmail = VerifiedEmailSchema.safeParse(email);
  const parsedDomain = OrganizationDomainSchema.safeParse(organizationDomain);
  if (!parsedEmail.success || !parsedDomain.success) return false;
  const emailDomain = parsedEmail.data.slice(parsedEmail.data.lastIndexOf('@') + 1).toLowerCase();
  const organization = parsedDomain.data.toLowerCase();
  return !isPublicEmailDomain(organization) && emailDomain === organization;
}

async function authenticate(request: FastifyRequest): Promise<CommunityIdentity> {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    throw requestError(401, 'UNAUTHORIZED', 'Authentication required');
  }

  try {
    const token = await createFirebaseTokenVerifier().verifyIdToken(
      authorization.slice('Bearer '.length)
    );
    const email = VerifiedEmailSchema.safeParse(token.email);
    return {
      firebaseUid: token.uid,
      email: email.success ? email.data : null,
      emailVerified: token.email_verified === true,
      roles: Array.isArray(token.roles)
        ? token.roles.filter((role): role is string => typeof role === 'string')
        : []
    };
  } catch (error) {
    if (error instanceof FirebaseAuthUnavailableError) {
      throw requestError(503, 'AUTH_UNAVAILABLE', 'Authentication is temporarily unavailable');
    }
    if (
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      error.statusCode === 403
    ) {
      throw error;
    }
    throw requestError(401, 'UNAUTHORIZED', 'Invalid or expired Firebase token');
  }
}

export function registerCommunityRoutes(app: FastifyInstance): void {
  app.get('/api/v1/circles/available', async (request, reply) => {
    const identity = await authenticate(request);
    if (!identity.email || !identity.emailVerified) {
      return reply.status(403).send({
        error: {
          code: 'VERIFIED_ORGANIZATION_EMAIL_REQUIRED',
          message: 'Verify your organization email to discover its Circle',
          requestId: request.id
        }
      });
    }
    const domain = identity.email.slice(identity.email.lastIndexOf('@') + 1).toLowerCase();
    if (isPublicEmailDomain(domain)) {
      return reply.status(403).send({
        error: {
          code: 'ORGANIZATION_EMAIL_REQUIRED',
          message: 'Use a verified organization email to discover a Work Circle',
          requestId: request.id
        }
      });
    }

    const db = firestore();
    const snapshot = await db
      .collection('circles')
      .where('organizationDomain', '==', domain)
      .where('status', '==', 'approved')
      .limit(20)
      .get();
    const circles = await Promise.all(
      snapshot.docs.map(async (circle) => {
        if (circle.get('ownerFirebaseUid') === identity.firebaseUid) {
          return {
            circleId: circle.id,
            name: circle.get('name'),
            membershipStatus: 'approved' as const
          };
        }
        const membership = await db
          .collection('circleMemberships')
          .doc(hashedId(circle.id, identity.firebaseUid))
          .get();
        const storedStatus = membership.exists ? membership.get('status') : null;
        const membershipStatus =
          storedStatus === 'approved' || storedStatus === 'pending' || storedStatus === 'rejected'
            ? storedStatus
            : membership.exists
              ? 'pending'
              : 'not_requested';
        return {
          circleId: circle.id,
          name: circle.get('name'),
          membershipStatus
        };
      })
    );
    return reply.send(AvailableCirclesResponseSchema.parse({ circles }));
  });

  app.post('/api/v1/circles/:circleId/membership-requests', async (request, reply) => {
    const identity = await authenticate(request);
    const params = CircleParamsSchema.safeParse(request.params);
    const body = MembershipRequestBodySchema.safeParse(request.body ?? {});
    const key = getIdempotencyKey(request);
    if (!params.success || !body.success || !key) {
      return reply.status(400).send({
        error: {
          code: !key ? 'IDEMPOTENCY_KEY_REQUIRED' : 'VALIDATION_ERROR',
          message: !key ? 'Idempotency-Key header is required' : 'Invalid membership request',
          requestId: request.id
        }
      });
    }

    const db = firestore();
    const { circleId } = params.data;
    const now = new Date();
    const idempotencyId = hashedId(identity.firebaseUid, request.method, request.url, key);
    const fingerprint = requestFingerprint(body.data);
    const idempotencyRef = db.collection('idempotency').doc(idempotencyId);
    const circleRef = db.collection('circles').doc(circleId);
    const membershipRef = db.collection('circleMemberships').doc(hashedId(circleId, identity.firebaseUid));
    const auditRef = db.collection('audit').doc();

    const result = await db.runTransaction(async (transaction) => {
      const idempotency = await transaction.get(idempotencyRef);
      if (idempotency.exists) {
        const record = idempotency.data();
        if (record?.state === 'completed') {
          if (record.requestHash !== fingerprint) {
            throw requestError(409, 'IDEMPOTENCY_KEY_REUSED', 'Idempotency key was used for different request data');
          }
          return { status: record.responseStatus as number, body: record.responseBody };
        }
        throw requestError(409, 'IDEMPOTENCY_IN_PROGRESS', 'Membership request is already processing');
      }

      const circleSnapshot = await transaction.get(circleRef);
      if (!circleSnapshot.exists || circleSnapshot.get('status') !== 'approved') {
        throw requestError(404, 'CIRCLE_NOT_AVAILABLE', 'Approved organization was not found');
      }
      const organizationDomain = circleSnapshot.get('organizationDomain');
      if (!identity.email || !isVerifiedOrganizationEmail(identity.email, identity.emailVerified, organizationDomain)) {
        throw requestError(403, 'ORGANIZATION_EMAIL_MISMATCH', 'Verified email does not match this organization');
      }

      const existingMembership = await transaction.get(membershipRef);
      if (circleSnapshot.get('ownerFirebaseUid') === identity.firebaseUid) {
        throw requestError(409, 'ALREADY_A_MEMBER', 'Organization owner membership already exists');
      }
      if (existingMembership.exists) {
        const status = existingMembership.get('status');
        if (status === 'approved') {
          throw requestError(409, 'ALREADY_A_MEMBER', 'Membership is already approved');
        }
        if (status === 'pending') {
          throw requestError(409, 'MEMBERSHIP_REQUEST_PENDING', 'Membership request is awaiting review');
        }
      }

      const resultBody = {
        circleId,
        status: 'pending',
        message: 'Membership request submitted for operator review'
      };
      transaction.set(membershipRef, {
        circleId,
        firebaseUid: identity.firebaseUid,
        role: 'member',
        verificationSource: 'verified_org_email',
        verifiedOrganizationDomain: organizationDomain,
        status: 'pending',
        requestedAt: now,
        updatedAt: now
      });
      transaction.create(idempotencyRef, {
        actorId: identity.firebaseUid,
        method: request.method,
        path: request.url,
        key,
        requestHash: fingerprint,
        state: 'completed',
        responseStatus: 202,
        responseBody: resultBody,
        createdAt: now,
        completedAt: now
      });
      transaction.create(auditRef, {
        actorId: identity.firebaseUid,
        action: 'circle.membership.request',
        targetType: 'circle_membership',
        targetId: membershipRef.id,
        requestId: request.id,
        idempotencyKey: key,
        outcome: 'success',
        createdAt: now
      });
      return { status: 202, body: resultBody };
    });

    return reply.status(result.status).send(result.body);
  });

  app.get('/api/v1/circles/:circleId/membership-status', async (request, reply) => {
    const identity = await authenticate(request);
    const params = CircleParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid Circle ID', requestId: request.id }
      });
    }

    const db = firestore();
    const circleRef = db.collection('circles').doc(params.data.circleId);
    const membershipRef = db
      .collection('circleMemberships')
      .doc(hashedId(params.data.circleId, identity.firebaseUid));
    const [circle, membership] = await Promise.all([circleRef.get(), membershipRef.get()]);
    if (!circle.exists) {
      return reply.status(404).send({
        error: { code: 'CIRCLE_NOT_FOUND', message: 'Organization was not found', requestId: request.id }
      });
    }

    const isReviewer = identity.roles.includes('operator') || identity.roles.includes('admin');
    const organizationDomain = circle.get('organizationDomain');
    if (
      !isReviewer &&
      (!identity.email || !isVerifiedOrganizationEmail(identity.email, identity.emailVerified, organizationDomain))
    ) {
      return reply.status(404).send({
        error: { code: 'CIRCLE_NOT_FOUND', message: 'Organization was not found', requestId: request.id }
      });
    }

    return reply.send({
      circleId: circle.id,
      organizationName: circle.get('name'),
      membershipStatus:
        circle.get('ownerFirebaseUid') === identity.firebaseUid
          ? circle.get('status')
          : membership.exists
            ? membership.get('status')
            : 'not_requested'
    });
  });

  app.post('/api/v1/operations/circles/:circleId/memberships/:memberUid/review', async (request, reply) => {
    const identity = await authenticate(request);
    if (!identity.roles.includes('operator') && !identity.roles.includes('admin')) {
      throw requestError(403, 'FORBIDDEN', 'Operator or admin role required');
    }
    const params = z.object({
      circleId: CircleParamsSchema.shape.circleId,
      memberUid: z.string().trim().min(1).max(128).regex(/^[^/]+$/)
    }).safeParse(request.params);
    const body = z.object({
      decision: z.enum(['approve', 'reject']),
      reviewNote: z.string().trim().max(500).optional()
    }).strict().safeParse(request.body);
    const key = getIdempotencyKey(request);
    if (!params.success || !body.success || !key) {
      return reply.status(400).send({
        error: {
          code: !key ? 'IDEMPOTENCY_KEY_REQUIRED' : 'VALIDATION_ERROR',
          message: !key ? 'Idempotency-Key header is required' : 'Invalid membership review request',
          requestId: request.id
        }
      });
    }
    if (params.data.memberUid === identity.firebaseUid) {
      throw requestError(403, 'SELF_REVIEW_FORBIDDEN', 'Reviewers cannot approve their own membership');
    }

    const db = firestore();
    const now = new Date();
    const memberRef = db.collection('circleMemberships')
      .doc(hashedId(params.data.circleId, params.data.memberUid));
    const circleRef = db.collection('circles').doc(params.data.circleId);
    const idempotencyRef = db.collection('idempotency')
      .doc(hashedId(identity.firebaseUid, request.method, request.url, key));
    const fingerprint = requestFingerprint(body.data);
    const auditRef = db.collection('audit').doc();
    const result = await db.runTransaction(async (transaction) => {
      const idempotency = await transaction.get(idempotencyRef);
      if (idempotency.exists) {
        const record = idempotency.data();
        if (record?.state === 'completed') {
          if (record.requestHash !== fingerprint) {
            throw requestError(409, 'IDEMPOTENCY_KEY_REUSED', 'Idempotency key was used for different request data');
          }
          return { status: record.responseStatus as number, body: record.responseBody };
        }
        throw requestError(409, 'IDEMPOTENCY_IN_PROGRESS', 'Membership review is already processing');
      }
      const circle = await transaction.get(circleRef);
      const member = await transaction.get(memberRef);
      if (!circle.exists || !member.exists || member.get('status') !== 'pending') {
        throw requestError(404, 'PENDING_MEMBERSHIP_NOT_FOUND', 'Pending membership was not found');
      }
      const status = body.data.decision === 'approve' ? 'approved' : 'rejected';
      const responseBody = { circleId: circle.id, membershipStatus: status };
      transaction.update(memberRef, {
        status,
        reviewedBy: identity.firebaseUid,
        reviewedAt: now,
        reviewNote: body.data.reviewNote ?? null,
        updatedAt: now
      });
      transaction.create(idempotencyRef, {
        actorId: identity.firebaseUid,
        method: request.method,
        path: request.url,
        key,
        requestHash: fingerprint,
        state: 'completed',
        responseStatus: 200,
        responseBody,
        createdAt: now,
        completedAt: now
      });
      transaction.create(auditRef, {
        actorId: identity.firebaseUid,
        action: `circle.membership.${status}`,
        targetType: 'circle_membership',
        targetId: memberRef.id,
        requestId: request.id,
        idempotencyKey: key,
        outcome: 'success',
        createdAt: now
      });
      return { status: 200, body: responseBody };
    });
    return reply.status(result.status).send(result.body);
  });
}
