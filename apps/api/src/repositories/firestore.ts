import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { initializeFirebaseAdmin } from '../auth/firebase.js';

export function firestore(): Firestore {
  initializeFirebaseAdmin();
  return getFirestore();
}

export interface StoredUser {
  firebaseUid: string;
  email: string | null;
  photoUrl: string | null;
  phone: string | null;
  displayName: string | null;
  preferredLanguage: 'en' | 'hi' | 'te';
  accessibilityPreferences: string[];
  deletionState: 'active' | 'pending_deletion' | 'deleted';
}

export async function getOrCreateUser(
  firebaseUid: string,
  profile: { email?: string; picture?: string; phone_number?: string }
): Promise<StoredUser> {
  const db = firestore();
  const reference = db.collection('users').doc(firebaseUid);
  const snapshot = await reference.get();
  if (snapshot.exists) {
    return snapshot.data() as StoredUser;
  }

  const user: StoredUser = {
    firebaseUid,
    email: profile.email ?? null,
    photoUrl: profile.picture ?? null,
    phone: profile.phone_number ?? null,
    displayName: null,
    preferredLanguage: 'en',
    accessibilityPreferences: [],
    deletionState: 'active'
  };
  await reference.set({ ...user, createdAt: new Date(), updatedAt: new Date() });
  return user;
}

export async function findIdempotentResponse(
  actorId: string,
  method: string,
  path: string,
  key: string
): Promise<{ status: number; body: unknown } | null> {
  const snapshot = await firestore()
    .collection('idempotency')
    .where('actorId', '==', actorId)
    .where('method', '==', method)
    .where('path', '==', path)
    .where('key', '==', key)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  const record = snapshot.docs[0]?.data();
  if (!record) return null;
  return { status: record.responseStatus as number, body: record.responseBody };
}

export async function recordIdempotentResponse(
  actorId: string,
  method: string,
  path: string,
  key: string,
  status: number,
  body: unknown
): Promise<void> {
  await firestore().collection('idempotency').add({
    actorId,
    method,
    path,
    key,
    responseStatus: status,
    responseBody: body,
    createdAt: new Date()
  });
}

export async function recordAudit(
  actorId: string,
  action: string,
  targetType: string,
  targetId: string,
  requestId: string,
  idempotencyKey: string,
  outcome: 'success' | 'failure'
): Promise<void> {
  await firestore().collection('audit').add({
    actorId,
    action,
    targetType,
    targetId,
    requestId,
    idempotencyKey,
    outcome,
    createdAt: new Date()
  });
}
