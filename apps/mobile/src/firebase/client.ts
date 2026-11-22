import Constants from 'expo-constants';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
  type Auth,
  type User
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
}

export class FirebaseNotConfiguredError extends Error {
  constructor() {
    super('Firebase web configuration is missing for this build');
    this.name = 'FirebaseNotConfiguredError';
  }
}

function readConfig(): FirebaseWebConfig | null {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
  const apiKey = extra.firebaseWebApiKey;
  const authDomain = extra.firebaseWebAuthDomain;
  const projectId = extra.firebaseProjectId;
  const appId = extra.firebaseAppId;
  if (
    typeof apiKey !== 'string' ||
    typeof authDomain !== 'string' ||
    typeof projectId !== 'string' ||
    typeof appId !== 'string' ||
    !apiKey ||
    !authDomain ||
    !projectId ||
    !appId
  ) {
    return null;
  }
  return { apiKey, authDomain, projectId, appId };
}

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
let cachedDb: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (cachedApp) return cachedApp;
  const config = readConfig();
  if (!config) throw new FirebaseNotConfiguredError();
  cachedApp = getApps().length > 0 ? getApp() : initializeApp(config);
  return cachedApp;
}

export function getFirebaseAuth(): Auth {
  if (cachedAuth) return cachedAuth;
  cachedAuth = getAuth(getFirebaseApp());
  return cachedAuth;
}

export function getFirestoreDb(): Firestore {
  if (cachedDb) return cachedDb;
  cachedDb = getFirestore(getFirebaseApp());
  return cachedDb;
}

export async function ensureAuthPersistence(): Promise<void> {
  await setPersistence(getFirebaseAuth(), browserLocalPersistence);
}

export async function getIdTokenOrNull(user: User | null): Promise<string | null> {
  if (!user) return null;
  return user.getIdToken();
}

export function isFirebaseConfigured(): boolean {
  return readConfig() !== null;
}
