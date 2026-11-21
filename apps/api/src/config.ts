import dotenv from 'dotenv';

dotenv.config({ path: '../../.env.local' });
import { z } from 'zod';

const ConfigSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    API_PORT: z.coerce.number().int().positive().default(3000),
    APP_MODE: z.enum(['demo', 'live']).default('demo'),
    RIDER_AGREEMENT_ENABLED: z.enum(['true', 'false']).default('false'),
    GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
    FIREBASE_PROJECT_ID: z.string().optional(),
    FIREBASE_CLIENT_EMAIL: z.string().optional(),
    FIREBASE_PRIVATE_KEY: z.string().optional(),
    GOOGLE_CLOUD_PROJECT_ID: z.string().optional(),
    GOOGLE_CLOUD_PROJECT_NUMBER: z.string().regex(/^\d+$/).optional(),
    GOOGLE_WORKLOAD_IDENTITY_POOL_ID: z.string().regex(/^[a-z0-9-]{4,32}$/).optional(),
    GOOGLE_WORKLOAD_IDENTITY_PROVIDER_ID: z.string().regex(/^[a-z0-9-]{4,32}$/).optional(),
    GOOGLE_WORKLOAD_IDENTITY_AUDIENCE: z.string().optional(),
    GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().email().optional(),
    FIREBASE_WEB_API_KEY: z.string().optional(),
    FIREBASE_WEB_AUTH_DOMAIN: z.string().optional(),
    FIREBASE_APP_ID: z.string().optional(),
    FIREBASE_DATABASE_URL: z.string().url().optional(),
    FIREBASE_STORAGE_BUCKET: z.string().optional(),
    GOOGLE_MAPS_ROUTES_API_KEY: z.string().min(1).optional(),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    LIVE_SERVICE_ENABLED: z.enum(['true', 'false']).default('false')
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV === 'production' && !value.FIREBASE_PROJECT_ID) {
      ctx.addIssue({
        code: 'custom',
        path: ['FIREBASE_PROJECT_ID'],
        message: 'FIREBASE_PROJECT_ID is required in production'
      });
    }
    const workloadIdentityValues = [
      value.GOOGLE_CLOUD_PROJECT_ID,
      value.GOOGLE_CLOUD_PROJECT_NUMBER,
      value.GOOGLE_WORKLOAD_IDENTITY_POOL_ID,
      value.GOOGLE_WORKLOAD_IDENTITY_PROVIDER_ID,
      value.GOOGLE_WORKLOAD_IDENTITY_AUDIENCE,
      value.GOOGLE_SERVICE_ACCOUNT_EMAIL
    ];
    const hasAnyWorkloadIdentityValue = workloadIdentityValues.some(Boolean);
    const hasCompleteWorkloadIdentity = workloadIdentityValues.every(Boolean);
    if (hasAnyWorkloadIdentityValue && !hasCompleteWorkloadIdentity) {
      ctx.addIssue({
        code: 'custom',
        path: ['GOOGLE_WORKLOAD_IDENTITY_AUDIENCE'],
        message: 'Vercel Workload Identity Federation configuration must be complete'
      });
    }
    if (
      hasCompleteWorkloadIdentity &&
      value.GOOGLE_CLOUD_PROJECT_ID !== value.FIREBASE_PROJECT_ID
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['GOOGLE_CLOUD_PROJECT_ID'],
        message: 'Google Cloud and Firebase project IDs must match'
      });
    }
    if (hasCompleteWorkloadIdentity) {
      const expectedAudience = `//iam.googleapis.com/projects/${value.GOOGLE_CLOUD_PROJECT_NUMBER}/locations/global/workloadIdentityPools/${value.GOOGLE_WORKLOAD_IDENTITY_POOL_ID}/providers/${value.GOOGLE_WORKLOAD_IDENTITY_PROVIDER_ID}`;
      if (value.GOOGLE_WORKLOAD_IDENTITY_AUDIENCE !== expectedAudience) {
        ctx.addIssue({
          code: 'custom',
          path: ['GOOGLE_WORKLOAD_IDENTITY_AUDIENCE'],
          message: 'Workload identity audience must match the configured provider'
        });
      }
    }
    if (value.NODE_ENV === 'production' && !hasCompleteWorkloadIdentity) {
      ctx.addIssue({
        code: 'custom',
        path: ['GOOGLE_WORKLOAD_IDENTITY_AUDIENCE'],
        message: 'Vercel Workload Identity Federation is required in production'
      });
    }
    if (
      value.NODE_ENV === 'production' &&
      (value.FIREBASE_CLIENT_EMAIL || value.FIREBASE_PRIVATE_KEY)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['FIREBASE_PRIVATE_KEY'],
        message: 'Firebase Admin private keys are not permitted in production'
      });
    }
    if (value.LIVE_SERVICE_ENABLED === 'true') {
      ctx.addIssue({
        code: 'custom',
        path: ['LIVE_SERVICE_ENABLED'],
        message: 'Live ride service is not implemented and cannot be enabled in this release'
      });
    }
  });

export const config = ConfigSchema.parse(process.env);

export function liveDispatchEnabled(): boolean {
  return false;
}

export function firebaseAdminConfigured(): boolean {
  if (!config.FIREBASE_PROJECT_ID) return false;
  if (config.NODE_ENV === 'production') {
    return Boolean(
      config.GOOGLE_CLOUD_PROJECT_ID &&
        config.GOOGLE_CLOUD_PROJECT_NUMBER &&
        config.GOOGLE_WORKLOAD_IDENTITY_POOL_ID &&
        config.GOOGLE_WORKLOAD_IDENTITY_PROVIDER_ID &&
        config.GOOGLE_WORKLOAD_IDENTITY_AUDIENCE &&
        config.GOOGLE_SERVICE_ACCOUNT_EMAIL
    );
  }
  return Boolean(
    (config.FIREBASE_CLIENT_EMAIL && config.FIREBASE_PRIVATE_KEY) ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS
  );
}
