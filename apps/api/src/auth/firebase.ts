import { AsyncLocalStorage } from 'node:async_hooks';
import { ExternalAccountClient } from 'google-auth-library';
import { applicationDefault, cert, getApps, initializeApp, type Credential } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from '../config.js';

const vercelOidcContext = new AsyncLocalStorage<string | undefined>();

export function runWithVercelOidcToken<T>(token: string | undefined, operation: () => T): T {
  return vercelOidcContext.run(token, operation);
}

export function hasVercelOidcToken(): boolean {
  return Boolean(vercelOidcContext.getStore());
}

function createVercelWorkloadIdentityCredential(): Credential {
  const {
    GOOGLE_CLOUD_PROJECT_NUMBER: projectNumber,
    GOOGLE_WORKLOAD_IDENTITY_POOL_ID: poolId,
    GOOGLE_WORKLOAD_IDENTITY_PROVIDER_ID: providerId,
    GOOGLE_WORKLOAD_IDENTITY_AUDIENCE: audience,
    GOOGLE_SERVICE_ACCOUNT_EMAIL: serviceAccountEmail
  } = config;

  if (!projectNumber || !poolId || !providerId || !audience || !serviceAccountEmail) {
    throw new FirebaseAuthUnavailableError();
  }

  const expectedAudience = `//iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/providers/${providerId}`;
  if (audience !== expectedAudience) throw new FirebaseAuthUnavailableError();

  const externalAccountClient = ExternalAccountClient.fromJSON({
    type: 'external_account',
    audience,
    subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
    token_url: 'https://sts.googleapis.com/v1/token',
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccountEmail}:generateAccessToken`,
    subject_token_supplier: {
      async getSubjectToken(): Promise<string> {
        const token = vercelOidcContext.getStore();
        if (!token) throw new FirebaseAuthUnavailableError();
        return token;
      }
    }
  });

  if (!externalAccountClient) throw new FirebaseAuthUnavailableError();

  return {
    async getAccessToken() {
      const { token } = await externalAccountClient.getAccessToken();
      if (!token) throw new FirebaseAuthUnavailableError();
      return { access_token: token, expires_in: 3600 };
    }
  };
}

export interface FirebaseTokenVerifier {
  verifyIdToken(idToken: string): Promise<DecodedIdToken>;
}

export class FirebaseAuthUnavailableError extends Error {
  constructor() {
    super('Firebase Authentication is not configured');
    this.name = 'FirebaseAuthUnavailableError';
  }
}

export function initializeFirebaseAdmin(): void {
  if (getApps().length > 0) return;

  const projectId = config.FIREBASE_PROJECT_ID;
  if (!projectId) throw new FirebaseAuthUnavailableError();

  if (config.NODE_ENV === 'production') {
    initializeApp({ credential: createVercelWorkloadIdentityCredential(), projectId });
    return;
  }

  const clientEmail = config.FIREBASE_CLIENT_EMAIL;
  const privateKey = config.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  initializeApp({
    credential:
      clientEmail && privateKey
        ? cert({ projectId, clientEmail, privateKey })
        : applicationDefault(),
    projectId
  });
}

export async function verifyFirebaseAdminAccess(): Promise<void> {
  initializeFirebaseAdmin();
  try {
    await getAuth().getUser('__herway_wif_health_probe__');
  } catch (error) {
    if (
      typeof error !== 'object' ||
      error === null ||
      !('code' in error) ||
      error.code !== 'auth/user-not-found'
    ) {
      throw error;
    }
  }
  await getFirestore()
    .collection('users')
    .doc('__herway_wif_health_probe__')
    .get();
}

export function createFirebaseTokenVerifier(): FirebaseTokenVerifier {
  return {
    async verifyIdToken(idToken: string): Promise<DecodedIdToken> {
      if (!config.FIREBASE_PROJECT_ID) throw new FirebaseAuthUnavailableError();
      if (config.NODE_ENV === 'production' && !vercelOidcContext.getStore()) {
        throw new FirebaseAuthUnavailableError();
      }

      initializeFirebaseAdmin();

      return getAuth().verifyIdToken(idToken, true);
    }
  };
}
