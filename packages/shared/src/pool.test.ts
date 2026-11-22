import { describe, expect, it } from 'vitest';
import {
  CommunityPostCreateSchema,
  PoolCreateSchema,
  canJoinPool,
  poolStatusAfterJoin
} from './pool.js';

const validPool = {
  origin: 'HITEC City Gate 2',
  destination: 'Madhapur Metro',
  originPoint: { lat: 17.4435, lng: 78.3772 },
  destinationPoint: { lat: 17.4483, lng: 78.3915 },
  departureAt: 1_800_000_000_000,
  seatsTotal: 3,
  fareShareInr: 80
} as const;

describe('pool contract', () => {
  it('accepts a valid pool and rejects identical endpoints', () => {
    expect(PoolCreateSchema.safeParse(validPool).success).toBe(true);
    expect(
      PoolCreateSchema.safeParse({ ...validPool, destination: validPool.origin }).success
    ).toBe(false);
  });

  it('rejects a single-seat pool and negative fare', () => {
    expect(PoolCreateSchema.safeParse({ ...validPool, seatsTotal: 1 }).success).toBe(false);
    expect(PoolCreateSchema.safeParse({ ...validPool, fareShareInr: -1 }).success).toBe(false);
  });
});

describe('pool join guards', () => {
  const base = {
    status: 'OPEN' as const,
    seatsTotal: 3,
    hostUid: 'host-1',
    members: [{ uid: 'host-1', displayName: 'Host', joinedAt: 1 }]
  };

  it('allows a new rider into an open pool', () => {
    expect(canJoinPool(base, 'rider-2')).toEqual({ ok: true });
  });

  it('blocks the host from joining their own pool', () => {
    expect(canJoinPool(base, 'host-1')).toEqual({ ok: false, reason: 'self_join' });
  });

  it('blocks duplicate joins', () => {
    const joined = { ...base, members: [...base.members, { uid: 'rider-2', displayName: 'R', joinedAt: 2 }] };
    expect(canJoinPool(joined, 'rider-2')).toEqual({ ok: false, reason: 'already_member' });
  });

  it('blocks a full pool', () => {
    const full = {
      ...base,
      members: [
        { uid: 'host-1', displayName: 'Host', joinedAt: 1 },
        { uid: 'rider-2', displayName: 'R2', joinedAt: 2 },
        { uid: 'rider-3', displayName: 'R3', joinedAt: 3 }
      ]
    };
    expect(canJoinPool(full, 'rider-4')).toEqual({ ok: false, reason: 'full' });
  });

  it('blocks a closed pool', () => {
    expect(canJoinPool({ ...base, status: 'CLOSED' }, 'rider-2')).toEqual({
      ok: false,
      reason: 'not_open'
    });
  });

  it('marks a pool full exactly at capacity', () => {
    expect(poolStatusAfterJoin(3, 2)).toBe('OPEN');
    expect(poolStatusAfterJoin(3, 3)).toBe('FULL');
  });
});

describe('community post contract', () => {
  it('accepts a nickname post and rejects unsafe nicknames', () => {
    const post = { nickname: 'Neha K.', category: 'share_request', body: 'Anyone to Gachibowli at 6?' };
    expect(CommunityPostCreateSchema.safeParse(post).success).toBe(true);
    expect(
      CommunityPostCreateSchema.safeParse({ ...post, nickname: '<script>' }).success
    ).toBe(false);
  });
});
