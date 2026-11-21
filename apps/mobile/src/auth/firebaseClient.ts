import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';

interface FirebaseExtra {
  firebaseWebApiKey?: string;
  firebaseAuthDomain?: string;
  firebaseProjectId?: string;
  firebaseAppId?: string;
}

export interface PhoneOtpProvider {
  sendOtp(phoneE164: string): Promise<ConfirmationResult | null>;
}

export interface GoogleAuthProvider {
  signIn(): Promise<{ user: { getIdToken(): Promise<string> } }>;
}

export class FirebaseOtpUnavailableError extends Error {
  constructor() {
    super('Firebase OTP is not configured for this build');
    this.name = 'FirebaseOtpUnavailableError';
  }
}

export type FirebaseAuthFailureKind =
  | 'unavailable'
  | 'denied'
  | 'expired'
  | 'network'
  | 'invalid'
  | 'retry';

export function classifyFirebaseAuthError(error: unknown): FirebaseAuthFailureKind {
  if (error instanceof FirebaseOtpUnavailableError) return 'unavailable';
  if (!(error instanceof Error) && typeof error !== 'object') return 'retry';

  const code =
    typeof (error as { code?: unknown }).code === 'string'
      ? (error as { code: string }).code
      : '';

  if (
    code.includes('network') ||
    code === 'auth/network-request-failed' ||
    code === 'auth/timeout'
  ) {
    return 'network';
  }
  if (
    error instanceof Error &&
    (error.message.toLowerCase().includes('network') ||
      error.message.toLowerCase().includes('fetch') ||
      error.message.toLowerCase().includes('failed to fetch'))
  ) {
    return 'network';
  }
  if (
    code === 'auth/popup-closed-by-user' ||
    code === 'auth/cancelled-popup-request' ||
    code === 'auth/user-cancelled' ||
    code === 'auth/unauthorized-domain'
  ) {
    return 'denied';
  }
  if (
    code === 'auth/code-expired' ||
    code === 'auth/session-expired' ||
    code === 'auth/invalid-verification-code'
  ) {
    return 'expired';
  }
  if (
    code === 'auth/invalid-phone-number' ||
    code === 'auth/missing-phone-number' ||
    code === 'auth/captcha-check-failed' ||
    code === 'auth/invalid-recaptcha-token'
  ) {
    return 'invalid';
  }
  return 'retry';
}

export function firebaseAuthFailureMessage(kind: FirebaseAuthFailureKind): string {
  switch (kind) {
    case 'unavailable':
      return 'Secure sign-in is not available for this build. Check Firebase provider configuration.';
    case 'denied':
      return 'Sign-in was denied or cancelled. Retry when you are ready.';
    case 'expired':
      return 'The code is invalid or expired. Request a new code.';
    case 'network':
      return 'Network error. Check your connection and retry.';
    case 'invalid':
      return 'Invalid phone number or verification check. Review the details and retry.';
    default:
      return 'Sign-in could not be completed. Please retry.';
  }
}

export function createFirebaseGoogleProvider(): GoogleAuthProvider {
  return {
    async signIn(): Promise<{ user: { getIdToken(): Promise<string> } }> {
      if (Platform.OS !== 'web') {
        throw new FirebaseOtpUnavailableError();
      }
      const extra = (Constants.expoConfig?.extra ?? {}) as FirebaseExtra;
      if (!extra.firebaseWebApiKey || !extra.firebaseProjectId || !extra.firebaseAppId) {
        throw new FirebaseOtpUnavailableError();
      }
      if (typeof window === 'undefined') {
        throw new FirebaseOtpUnavailableError();
      }

      const app =
        getApps()[0] ??
        initializeApp({
          apiKey: extra.firebaseWebApiKey,
          authDomain: extra.firebaseAuthDomain,
          projectId: extra.firebaseProjectId,
          appId: extra.firebaseAppId
        });
      const auth = getAuth(app);
      const {
        GoogleAuthProvider,
        signInWithPopup,
        signInWithRedirect,
        getRedirectResult
      } = await import('firebase/auth');

      const redirectResult = await getRedirectResult(auth);
      if (redirectResult) return redirectResult;

      try {
        return await signInWithPopup(auth, new GoogleAuthProvider());
      } catch (error) {
        const code =
          typeof (error as { code?: unknown }).code === 'string'
            ? (error as { code: string }).code
            : '';
        if (code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request') {
          await signInWithRedirect(auth, new GoogleAuthProvider());
          throw new Error('Google sign-in redirect started');
        }
        throw error;
      }
    }
  };
}

export function createFirebaseOtpProvider(recaptchaContainerId?: string): PhoneOtpProvider {
  return {
    async sendOtp(phoneE164: string): Promise<ConfirmationResult | null> {
      if (Platform.OS !== 'web') {
        throw new FirebaseOtpUnavailableError();
      }
      const extra = (Constants.expoConfig?.extra ?? {}) as FirebaseExtra;
      if (!extra.firebaseWebApiKey || !extra.firebaseProjectId || !extra.firebaseAppId) {
        throw new FirebaseOtpUnavailableError();
      }

      if (typeof window === 'undefined' || !recaptchaContainerId) {
        throw new FirebaseOtpUnavailableError();
      }

      const app =
        getApps()[0] ??
        initializeApp({
          apiKey: extra.firebaseWebApiKey,
          authDomain: extra.firebaseAuthDomain,
          projectId: extra.firebaseProjectId,
          appId: extra.firebaseAppId
        });
      const auth = getAuth(app);
      const { RecaptchaVerifier } = await import('firebase/auth');
      if (typeof document !== 'undefined' && !document.getElementById(recaptchaContainerId)) {
        const container = document.createElement('div');
        container.id = recaptchaContainerId;
        document.body.appendChild(container);
      }
      const verifier = new RecaptchaVerifier(auth, recaptchaContainerId, { size: 'invisible' });
      return signInWithPhoneNumber(auth, phoneE164, verifier);
    }
  };
}
