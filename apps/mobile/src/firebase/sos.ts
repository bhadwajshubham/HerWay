import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getFirestoreDb } from './client';

const CASES = 'sosCases';

export interface SOSInput {
  userId: string;
  rideId?: string;
  note?: string;
}

export async function createSOSCase(input: SOSInput): Promise<string> {
  const db = getFirestoreDb();
  const ref = await addDoc(collection(db, CASES), {
    userId: input.userId,
    rideId: input.rideId ?? null,
    note: input.note ?? '',
    status: 'ACTIVE',
    createdAt: serverTimestamp()
  });
  return ref.id;
}

export async function resolveSOSCase(caseId: string): Promise<void> {
  const db = getFirestoreDb();
  await updateDoc(doc(db, CASES, caseId), {
    status: 'RESOLVED',
    resolvedAt: serverTimestamp()
  });
}
