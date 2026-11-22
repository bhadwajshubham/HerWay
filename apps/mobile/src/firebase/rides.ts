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

const RIDES = 'rideRequests';
const CHAT = 'messages';

export interface RideActor {
  uid: string;
  displayName: string;
}

export interface CreateRideInput extends RideRequestCreate {
  riderName: string;
}

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === 'number') return value;
  return 0;
}

function mapRide(id: string, data: Record<string, unknown>): RideRequest {
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
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt)
  };
}

export async function createRide(
  actor: RideActor,
  input: CreateRideInput
): Promise<string> {
  const db = getFirestoreDb();
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
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return ref.id;
}

export function subscribeOpenRides(
  onChange: (rides: RideRequest[]) => void,
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
  onChange: (ride: RideRequest | null) => void,
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
  onChange: (rides: RideRequest[]) => void,
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
}

export async function advanceRide(
  rideId: string,
  from: RideStatus,
  actorUid: string
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
    transaction.update(ref, { status: target, updatedAt: serverTimestamp() });
  });
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
