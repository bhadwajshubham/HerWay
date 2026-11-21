import Fastify, { type FastifyError } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { HealthResponseSchema, PublicConfigSchema } from '@herway/shared';
import {
  hasVercelOidcToken,
  verifyFirebaseAdminAccess
} from './auth/firebase.js';
import { config, firebaseAdminConfigured, liveDispatchEnabled } from './config.js';
import { registerPhase1Routes } from './routes/phase1.js';
import { registerCommunityRoutes } from './routes/community.js';
import { registerDemoRoutes } from './routes/demo.js';

let firebaseReadinessCacheExpiresAt = 0;
let firebaseReadinessCheck: Promise<void> | undefined;

function firebaseReadinessFailureClass(error: unknown): string {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return 'firebase_admin_check_failed';
  }
  const code = error.code;
  if (typeof code !== 'string') return 'firebase_admin_check_failed';
  if (code === 'PERMISSION_DENIED' || code === 'UNAUTHENTICATED') return code.toLowerCase();
  if (/^auth\/[a-z-]+$/.test(code)) return code;
  if (code === 'ERR_ABORTED') return 'external_credential_exchange_aborted';
  return 'firebase_admin_check_failed';
}

async function verifyProductionFirebaseReadiness(
  log: { error(fields: Record<string, string>, message: string): void }
): Promise<boolean> {
  if (!hasVercelOidcToken()) return false;
  if (Date.now() < firebaseReadinessCacheExpiresAt) return true;

  firebaseReadinessCheck ??= verifyFirebaseAdminAccess();
  try {
    await firebaseReadinessCheck;
    firebaseReadinessCacheExpiresAt = Date.now() + 15_000;
    return true;
  } catch (error) {
    log.error(
      { failureClass: firebaseReadinessFailureClass(error) },
      'Firebase Admin readiness probe failed'
    );
    firebaseReadinessCacheExpiresAt = 0;
    return false;
  } finally {
    firebaseReadinessCheck = undefined;
  }
}

export function buildApp() {
  const app = Fastify({
    logger: {
      level: config.NODE_ENV === 'test' ? 'silent' : 'info'
    }
  });

  app.register(cors, { origin: false });
  app.register(helmet);

  app.addHook('onRequest', async (request, reply) => {
    reply.header('x-request-id', request.id);
  });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    request.log.error({ err: error, requestId: request.id }, 'request failed');
    reply.status(error.statusCode ?? 500).send({
      error: {
        code: error.code ?? 'INTERNAL_ERROR',
        message:
          error.statusCode && error.statusCode < 500
            ? error.message
            : 'An unexpected error occurred',
        requestId: request.id
      }
    });
  });
  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found',
        requestId: request.id
      }
    });
  });

  app.register(rateLimit, { max: 120, timeWindow: '1 minute' });

  app.get('/health/live', async () => {
    return HealthResponseSchema.parse({
      status: 'ok',
      service: 'herway-api',
      version: '0.1.0'
    });
  });

  app.get('/health/ready', async (request, reply) => {
    const configured = firebaseAdminConfigured();
    const ready =
      config.NODE_ENV === 'production'
        ? configured && (await verifyProductionFirebaseReadiness(request.log))
        : configured || config.NODE_ENV === 'test';
    return reply.status(ready ? 200 : 503).send({
      status: ready ? 'ok' : 'error',
      firebaseAdminConfigured: configured && (config.NODE_ENV !== 'production' || ready)
    });
  });

  registerPhase1Routes(app);
  registerCommunityRoutes(app);
  if (config.APP_MODE === 'demo' || config.NODE_ENV === 'test') {
    registerDemoRoutes(app);
  }

  app.get('/api/v1/config/public', async () => {
    const firebase = {
      projectId: config.FIREBASE_PROJECT_ID ?? 'herway-app-f6e0f',
      authDomain: config.FIREBASE_WEB_AUTH_DOMAIN ?? 'herway-app-f6e0f.firebaseapp.com',
      webApiKey: config.FIREBASE_WEB_API_KEY ?? 'AIzaSyCwXSB6Stts_a_z1qLR5YOL24TyETj7CHQ',
      appId: config.FIREBASE_APP_ID ?? '1:399711586983:web:458cd8b8c59378e45da982'
    };

    return PublicConfigSchema.parse({
      appMode: config.APP_MODE,
      liveDispatchEnabled: liveDispatchEnabled(),
      womenOnlyDefault: true,
      pilotZones: ['HITEC City corridor', 'Partner campus or office'],
      firebase
    });
  });

  return app;
}
