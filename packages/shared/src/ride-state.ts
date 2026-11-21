import { z } from 'zod';

export const RideStateSchema = z.enum([
  'IDLE',
  'SEARCHING',
  'MATCH_PROPOSED',
  'DRIVER_ACCEPTED',
  'ARRIVED',
  'IN_TRANSIT',
  'COMPLETED',
  'CANCELLED',
  'EXPIRED'
]);

export type RideState = z.infer<typeof RideStateSchema>;

export const SOSCaseStatusSchema = z.enum(['ACTIVE', 'ACKNOWLEDGED', 'ESCALATED', 'RESOLVED']);
export type SOSCaseStatus = z.infer<typeof SOSCaseStatusSchema>;

export const RideTransitionSchema = z.object({
  rideId: z.string().min(1),
  to: RideStateSchema,
  actorId: z.string().min(1),
  occurredAt: z.string().datetime()
});

const AllowedTransitions: Partial<Record<RideState, readonly RideState[]>> = {
  IDLE: ['SEARCHING'],
  SEARCHING: ['MATCH_PROPOSED', 'EXPIRED', 'CANCELLED'],
  MATCH_PROPOSED: ['DRIVER_ACCEPTED', 'SEARCHING', 'CANCELLED'],
  DRIVER_ACCEPTED: ['ARRIVED', 'CANCELLED'],
  ARRIVED: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
  EXPIRED: []
};

export function canTransitionRide(from: RideState, to: RideState): boolean {
  return AllowedTransitions[from]?.includes(to) ?? false;
}
