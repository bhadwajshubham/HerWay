import { describe, expect, it } from 'vitest';
import { ScheduledRideRequestSchema } from './contracts.js';

describe('scheduled ride request contract', () => {
  const valid = {
    pickup: 'HerWay Tower, HITEC City, Hyderabad',
    dropoff: 'Rajiv Gandhi International Airport, Hyderabad',
    rideCategory: 'standard',
    scheduledAt: '2026-11-23T09:30:00+05:30',
    locationUseConsent: true
  };

  it('requires usable addresses, timezone-aware time, and explicit address-use consent', () => {
    expect(ScheduledRideRequestSchema.safeParse(valid).success).toBe(true);
    expect(
      ScheduledRideRequestSchema.safeParse({ ...valid, locationUseConsent: false }).success
    ).toBe(false);
    expect(ScheduledRideRequestSchema.safeParse({ ...valid, scheduledAt: 'tomorrow morning' }).success)
      .toBe(false);
  });

  it('does not allow a non-women-captain request to bypass the hard requirement', () => {
    expect(ScheduledRideRequestSchema.safeParse({ ...valid, womenCaptainOnly: false }).success)
      .toBe(false);
  });
});
