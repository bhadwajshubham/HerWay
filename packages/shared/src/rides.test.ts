import { describe, expect, it } from 'vitest';
import {
  RideRequestCreateSchema,
  canTransitionRideStatus,
  nextRideStatus,
  rideStateToStatus
} from './rides.js';

const validRide = {
  pickup: 'HITEC City Gate 2, Hyderabad',
  dropoff: 'Rajiv Gandhi International Airport',
  pickupPoint: { lat: 17.4435, lng: 78.3772 },
  dropoffPoint: { lat: 17.2403, lng: 78.4294 },
  rideCategory: 'standard',
  seats: 1,
  womenOnly: true
} as const;

describe('ride request contract', () => {
  it('accepts a valid women-only request with defaults', () => {
    const parsed = RideRequestCreateSchema.safeParse(validRide);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.womenOnly).toBe(true);
      expect(parsed.data.seats).toBe(1);
    }
  });

  it('rejects identical pickup and dropoff', () => {
    expect(
      RideRequestCreateSchema.safeParse({ ...validRide, dropoff: validRide.pickup }).success
    ).toBe(false);
  });

  it('rejects a non women-only request', () => {
    expect(RideRequestCreateSchema.safeParse({ ...validRide, womenOnly: false }).success).toBe(false);
  });

  it('rejects out-of-range coordinates and seat counts', () => {
    expect(
      RideRequestCreateSchema.safeParse({
        ...validRide,
        pickupPoint: { lat: 120, lng: 78 }
      }).success
    ).toBe(false);
    expect(RideRequestCreateSchema.safeParse({ ...validRide, seats: 9 }).success).toBe(false);
  });
});

describe('ride status machine', () => {
  it('follows the happy path', () => {
    expect(nextRideStatus('SEARCHING')).toBe('DRIVER_ACCEPTED');
    expect(nextRideStatus('DRIVER_ACCEPTED')).toBe('ARRIVED');
    expect(nextRideStatus('ARRIVED')).toBe('IN_TRANSIT');
    expect(nextRideStatus('IN_TRANSIT')).toBe('COMPLETED');
    expect(nextRideStatus('COMPLETED')).toBeNull();
  });

  it('blocks illegal jumps', () => {
    expect(canTransitionRideStatus('SEARCHING', 'COMPLETED')).toBe(false);
    expect(canTransitionRideStatus('COMPLETED', 'SEARCHING')).toBe(false);
    expect(canTransitionRideStatus('SEARCHING', 'DRIVER_ACCEPTED')).toBe(true);
  });

  it('maps canonical ride states to statuses', () => {
    expect(rideStateToStatus('SEARCHING')).toBe('SEARCHING');
    expect(rideStateToStatus('DRIVER_ACCEPTED')).toBe('DRIVER_ACCEPTED');
    expect(rideStateToStatus('MATCH_PROPOSED')).toBeNull();
    expect(rideStateToStatus('IDLE')).toBeNull();
  });
});
