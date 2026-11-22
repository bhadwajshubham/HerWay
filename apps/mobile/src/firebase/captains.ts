import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { Captain } from '@herway/shared';
import { getFirestoreDb } from './client';

const PROFILES = 'captainProfiles';

export interface CaptainProfileInput {
  displayName: string;
  vehicle: string;
  plate: string;
}

export async function ensureCaptainProfile(
  uid: string,
  input: CaptainProfileInput
): Promise<Captain> {
  const db = getFirestoreDb();
  const ref = doc(db, PROFILES, uid);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    const data = existing.data();
    return {
      uid,
      displayName: String(data.displayName),
      vehicle: String(data.vehicle),
      plate: String(data.plate),
      rating: Number(data.rating ?? 5),
      womenCaptain: true
    };
  }
  const captain: Captain = {
    uid,
    displayName: input.displayName.trim(),
    vehicle: input.vehicle.trim(),
    plate: input.plate.trim().toUpperCase(),
    rating: 5,
    womenCaptain: true
  };
  await setDoc(ref, { ...captain, createdAt: Date.now() });
  return captain;
}

export async function getCaptainProfile(uid: string): Promise<Captain | null> {
  const db = getFirestoreDb();
  const snapshot = await getDoc(doc(db, PROFILES, uid));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    uid,
    displayName: String(data.displayName ?? ''),
    vehicle: String(data.vehicle ?? ''),
    plate: String(data.plate ?? ''),
    rating: Number(data.rating ?? 5),
    womenCaptain: true
  };
}
