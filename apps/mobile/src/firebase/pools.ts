import {
  addDoc,
  arrayUnion,
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
  canJoinPool,
  poolStatusAfterJoin,
  type Pool,
  type PoolCreate,
  type PoolMember,
  type PoolStatus
} from '@herway/shared';
import { getFirestoreDb } from './client';

const POOLS = 'ridePools';

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === 'number') return value;
  return 0;
}

function mapPool(id: string, data: Record<string, unknown>): Pool {
  return {
    poolId: id,
    hostUid: String(data.hostUid ?? ''),
    hostName: String(data.hostName ?? ''),
    origin: String(data.origin ?? ''),
    destination: String(data.destination ?? ''),
    originPoint: (data.originPoint as Pool['originPoint']) ?? { lat: 0, lng: 0 },
    destinationPoint: (data.destinationPoint as Pool['destinationPoint']) ?? { lat: 0, lng: 0 },
    departureAt: toMillis(data.departureAt),
    seatsTotal: Number(data.seatsTotal ?? 2),
    fareShareInr: Number(data.fareShareInr ?? 0),
    note: typeof data.note === 'string' ? data.note : undefined,
    womenOnly: true,
    status: (data.status as PoolStatus) ?? 'OPEN',
    members: Array.isArray(data.members) ? (data.members as PoolMember[]) : [],
    createdAt: toMillis(data.createdAt)
  };
}

export async function createPool(
  host: { uid: string; displayName: string },
  input: PoolCreate
): Promise<string> {
  const db = getFirestoreDb();
  const members: PoolMember[] = [
    { uid: host.uid, displayName: host.displayName, joinedAt: Date.now() }
  ];
  const ref = await addDoc(collection(db, POOLS), {
    hostUid: host.uid,
    hostName: host.displayName,
    origin: input.origin,
    destination: input.destination,
    originPoint: input.originPoint,
    destinationPoint: input.destinationPoint,
    departureAt: Timestamp.fromMillis(input.departureAt),
    seatsTotal: input.seatsTotal,
    fareShareInr: input.fareShareInr,
    note: input.note ?? null,
    womenOnly: true,
    status: 'OPEN',
    members,
    createdAt: serverTimestamp()
  });
  return ref.id;
}

export function subscribeOpenPools(
  onChange: (pools: Pool[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const db = getFirestoreDb();
  const q = query(
    collection(db, POOLS),
    where('status', 'in', ['OPEN', 'FULL']),
    orderBy('departureAt', 'asc'),
    limit(25)
  );
  return onSnapshot(
    q,
    (snapshot) => onChange(snapshot.docs.map((entry) => mapPool(entry.id, entry.data()))),
    (error) => onError?.(error)
  );
}

export async function joinPool(
  poolId: string,
  member: { uid: string; displayName: string }
): Promise<void> {
  const db = getFirestoreDb();
  await runTransaction(db, async (transaction) => {
    const ref = doc(db, POOLS, poolId);
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('Pool no longer exists');
    const pool = mapPool(snapshot.id, snapshot.data());
    const check = canJoinPool(pool, member.uid);
    if (!check.ok) throw new Error(`Cannot join pool: ${check.reason}`);
    const nextMembers = [
      ...pool.members,
      { uid: member.uid, displayName: member.displayName, joinedAt: Date.now() }
    ];
    transaction.update(ref, {
      members: arrayUnion({ uid: member.uid, displayName: member.displayName, joinedAt: Date.now() }),
      status: poolStatusAfterJoin(pool.seatsTotal, nextMembers.length)
    });
  });
}

export async function leavePool(poolId: string, uid: string): Promise<void> {
  const db = getFirestoreDb();
  await runTransaction(db, async (transaction) => {
    const ref = doc(db, POOLS, poolId);
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('Pool no longer exists');
    const pool = mapPool(snapshot.id, snapshot.data());
    if (pool.hostUid === uid) throw new Error('Host cannot leave; close the pool instead');
    const remaining = pool.members.filter((entry) => entry.uid !== uid);
    if (remaining.length === pool.members.length) throw new Error('You are not in this pool');
    transaction.update(ref, { members: remaining, status: 'OPEN' });
  });
}

export async function closePool(poolId: string, hostUid: string): Promise<void> {
  const db = getFirestoreDb();
  await runTransaction(db, async (transaction) => {
    const ref = doc(db, POOLS, poolId);
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('Pool no longer exists');
    const pool = mapPool(snapshot.id, snapshot.data());
    if (pool.hostUid !== hostUid) throw new Error('Only the host can close this pool');
    transaction.update(ref, { status: 'CLOSED' });
  });
}
