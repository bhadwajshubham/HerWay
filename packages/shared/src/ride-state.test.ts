import { describe, expect, it } from 'vitest';
import { canTransitionRide } from './ride-state.js';

describe('ride state machine', () => {
  it('allows the canonical happy path', () => {
    expect(canTransitionRide('IDLE', 'SEARCHING')).toBe(true);
    expect(canTransitionRide('SEARCHING', 'MATCH_PROPOSED')).toBe(true);
    expect(canTransitionRide('MATCH_PROPOSED', 'DRIVER_ACCEPTED')).toBe(true);
    expect(canTransitionRide('DRIVER_ACCEPTED', 'ARRIVED')).toBe(true);
    expect(canTransitionRide('ARRIVED', 'IN_TRANSIT')).toBe(true);
    expect(canTransitionRide('IN_TRANSIT', 'COMPLETED')).toBe(true);
  });

  it('rejects illegal transitions', () => {
    expect(canTransitionRide('IDLE', 'COMPLETED')).toBe(false);
    expect(canTransitionRide('COMPLETED', 'SEARCHING')).toBe(false);
  });

  it('supports EXPIRED for an unmatched women-only search', () => {
    expect(canTransitionRide('SEARCHING', 'EXPIRED')).toBe(true);
  });

  it('allows only explicit cancellations from active states', () => {
    expect(canTransitionRide('SEARCHING', 'CANCELLED')).toBe(true);
    expect(canTransitionRide('MATCH_PROPOSED', 'CANCELLED')).toBe(true);
    expect(canTransitionRide('DRIVER_ACCEPTED', 'CANCELLED')).toBe(true);
    expect(canTransitionRide('ARRIVED', 'CANCELLED')).toBe(true);
    expect(canTransitionRide('IN_TRANSIT', 'CANCELLED')).toBe(true);
  });

  it('rejects transitions from terminal states and SOS-like states', () => {
    expect(canTransitionRide('COMPLETED', 'CANCELLED')).toBe(false);
    expect(canTransitionRide('CANCELLED', 'IN_TRANSIT')).toBe(false);
    expect(canTransitionRide('EXPIRED', 'SEARCHING')).toBe(false);
  });
});
