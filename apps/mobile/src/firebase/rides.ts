import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  where,
  type Unsubscribe
} from 'firebase/firestore';
import {
  canTransitionRideStatus,
  nextRideStatus,
  type Captain,
  type RideChatMessage,
  type RideRequest,
  type RideRequestCreate,
  type RideStatus
} from '@herway/shared';
import { getFirestoreDb } from './client';
import { setActiveRideId } from './activeRide';

const RIDES = 'rideRequests';
const CHAT = 'messages';

export interface RideActor {
  uid: string;
  displayName: string;
}

export interface CreateRideInput extends RideRequestCreate {
  riderName: string;
}

export type RideWithPin = RideRequest & {
  startPin: string;
};

function generateStartPin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function deriveFallbackPin(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 9000;
  }
  return String(1000 + Math.abs(hash));
}

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === 'number') return value;
  return 0;
}

function mapRide(id: string, data: Record<string, unknown>): RideWithPin {
  const rawPin = typeof data.startPin === 'string' ? data.startPin.trim() : '';
  return {
    rideId: id,
    riderUid: String(data.riderUid ?? ''),
    riderName: String(data.riderName ?? ''),
    pickup: String(data.pickup ?? ''),
    dropoff: String(data.dropoff ?? ''),
    pickupPoint: (data.pickupPoint as RideRequest['pickupPoint']) ?? { lat: 0, lng: 0 },
    dropoffPoint: (data.dropoffPoint as RideRequest['dropoffPoint']) ?? { lat: 0, lng: 0 },
    rideCategory: (data.rideCategory as RideRequest['rideCategory']) ?? 'standard',
    seats: Number(data.seats ?? 1),
    womenOnly: true,
    note: typeof data.note === 'string' ? data.note : undefined,
    status: (data.status as RideStatus) ?? 'SEARCHING',
    captain: (data.captain as Captain | null) ?? null,
    startPin: /^[0-9]{4}$/.test(rawPin) ? rawPin : deriveFallbackPin(id),
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt)
  };
}

export async function createRide(
  actor: RideActor,
  input: CreateRideInput
): Promise<string> {
  const db = getFirestoreDb();
  const startPin = generateStartPin();
  const ref = await addDoc(collection(db, RIDES), {
    riderUid: actor.uid,
    riderName: input.riderName,
    pickup: input.pickup,
    dropoff: input.dropoff,
    pickupPoint: input.pickupPoint,
    dropoffPoint: input.dropoffPoint,
    rideCategory: input.rideCategory,
    seats: input.seats,
    womenOnly: true,
    note: input.note ?? null,
    status: 'SEARCHING',
    captain: null,
    startPin,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  await setActiveRideId(ref.id);
  return ref.id;
}

export function subscribeOpenRides(
  onChange: (rides: RideWithPin[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const db = getFirestoreDb();
  const q = query(
    collection(db, RIDES),
    where('status', '==', 'SEARCHING'),
    orderBy('createdAt', 'desc'),
    limit(25)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      onChange(snapshot.docs.map((entry) => mapRide(entry.id, entry.data())));
    },
    (error) => onError?.(error)
  );
}

export function subscribeRide(
  rideId: string,
  onChange: (ride: RideWithPin | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const db = getFirestoreDb();
  return onSnapshot(
    doc(db, RIDES, rideId),
    (snapshot) => {
      onChange(snapshot.exists() ? mapRide(snapshot.id, snapshot.data()) : null);
    },
    (error) => onError?.(error)
  );
}

export function subscribeMyRides(
  uid: string,
  onChange: (rides: RideWithPin[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const db = getFirestoreDb();
  const q = query(
    collection(db, RIDES),
    where('riderUid', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(10)
  );
  return onSnapshot(
    q,
    (snapshot) => onChange(snapshot.docs.map((entry) => mapRide(entry.id, entry.data()))),
    (error) => onError?.(error)
  );
}

export async function acceptRide(
  rideId: string,
  captain: Captain
): Promise<void> {
  const db = getFirestoreDb();
  await runTransaction(db, async (transaction) => {
    const ref = doc(db, RIDES, rideId);
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('Ride no longer exists');
    const status = snapshot.data().status as RideStatus;
    if (status !== 'SEARCHING') throw new Error('Ride was already accepted');
    transaction.update(ref, {
      status: 'DRIVER_ACCEPTED',
      captain,
      updatedAt: serverTimestamp()
    });
  });
  await setActiveRideId(rideId);
}

export async function advanceRide(
  rideId: string,
  from: RideStatus,
  actorUid: string,
  enteredPin?: string
): Promise<RideStatus> {
  const target = nextRideStatus(from);
  if (!target) throw new Error('Ride cannot advance from its current status');
  if (!canTransitionRideStatus(from, target)) throw new Error('Illegal ride transition');
  const db = getFirestoreDb();
  await runTransaction(db, async (transaction) => {
    const ref = doc(db, RIDES, rideId);
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('Ride no longer exists');
    const data = snapshot.data();
    if (data.status !== from) throw new Error('Ride status changed; refresh');
    const captain = data.captain as Captain | null;
    if (captain?.uid !== actorUid) throw new Error('Only the assigned captain can advance this ride');
    if (from === 'ARRIVED' && target === 'IN_TRANSIT') {
      const mapped = mapRide(snapshot.id, data);
      if ((enteredPin ?? '').trim() !== mapped.startPin) {
        throw new Error('Invalid 4-digit Start PIN. Ask the rider for their code.');
      }
    }
    transaction.update(ref, { status: target, updatedAt: serverTimestamp() });
  });
  if (target === 'COMPLETED') {
    await setActiveRideId(null);
  }
  return target;
}

export async function cancelRide(rideId: string, actorUid: string): Promise<void> {
  const db = getFirestoreDb();
  await runTransaction(db, async (transaction) => {
    const ref = doc(db, RIDES, rideId);
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('Ride no longer exists');
    const data = snapshot.data();
    const status = data.status as RideStatus;
    if (status === 'COMPLETED' || status === 'CANCELLED') {
      throw new Error('Ride is already closed');
    }
    const captain = data.captain as Captain | null;
    if (data.riderUid !== actorUid && captain?.uid !== actorUid) {
      throw new Error('You are not part of this ride');
    }
    transaction.update(ref, { status: 'CANCELLED', updatedAt: serverTimestamp() });
  });
  await setActiveRideId(null);
}

export async function sendRideMessage(
  rideId: string,
  actor: RideActor,
  body: string
): Promise<void> {
  const db = getFirestoreDb();
  await addDoc(collection(db, RIDES, rideId, CHAT), {
    senderUid: actor.uid,
    senderName: actor.displayName,
    body: body.trim(),
    createdAt: serverTimestamp()
  });
}

export function subscribeRideMessages(
  rideId: string,
  onChange: (messages: RideChatMessage[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const db = getFirestoreDb();
  const q = query(
    collection(db, RIDES, rideId, CHAT),
    orderBy('createdAt', 'asc'),
    limit(100)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      onChange(
        snapshot.docs.map((entry) => {
          const data = entry.data();
          return {
            messageId: entry.id,
            rideId,
            senderUid: String(data.senderUid ?? ''),
            senderName: String(data.senderName ?? ''),
            body: String(data.body ?? ''),
            createdAt: toMillis(data.createdAt)
          };
        })
      );
    },
    (error) => onError?.(error)
  );
}