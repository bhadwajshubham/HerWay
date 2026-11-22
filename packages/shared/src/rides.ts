import { z } from 'zod';
import { canTransitionRide, type RideState } from './ride-state.js';

export const GeoPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
});
export type GeoPoint = z.infer<typeof GeoPointSchema>;

export const RideRequestCreateSchema = z
  .object({
    pickup: z.string().trim().min(3).max(240),
    dropoff: z.string().trim().min(3).max(240),
    pickupPoint: GeoPointSchema,
    dropoffPoint: GeoPointSchema,
    rideCategory: z.enum(['standard', 'premium', 'accessible']).default('standard'),
    seats: z.number().int().min(1).max(4).default(1),
    womenOnly: z.literal(true).default(true),
    note: z.string().trim().max(240).optional()
  })
  .strict()
  .refine((value) => value.pickup.toLowerCase() !== value.dropoff.toLowerCase(), {
    message: 'Pickup and dropoff must differ'
  });
export type RideRequestCreate = z.infer<typeof RideRequestCreateSchema>;

export const RideStatusSchema = z.enum([
  'SEARCHING',
  'DRIVER_ACCEPTED',
  'ARRIVED',
  'IN_TRANSIT',
  'COMPLETED',
  'CANCELLED'
]);
export type RideStatus = z.infer<typeof RideStatusSchema>;

export const CaptainSchema = z.object({
  uid: z.string().min(1).max(128),
  displayName: z.string().trim().min(1).max(80),
  vehicle: z.string().trim().min(1).max(80),
  plate: z.string().trim().min(3).max(16),
  rating: z.number().min(0).max(5),
  womenCaptain: z.literal(true)
});
export type Captain = z.infer<typeof CaptainSchema>;

export const RideRequestSchema = z.object({
  rideId: z.string().min(1).max(128),
  riderUid: z.string().min(1).max(128),
  riderName: z.string().trim().min(1).max(80),
  pickup: z.string().trim().min(3).max(240),
  dropoff: z.string().trim().min(3).max(240),
  pickupPoint: GeoPointSchema,
  dropoffPoint: GeoPointSchema,
  rideCategory: z.enum(['standard', 'premium', 'accessible']),
  seats: z.number().int().min(1).max(4),
  womenOnly: z.literal(true),
  note: z.string().trim().max(240).optional(),
  status: RideStatusSchema,
  captain: CaptainSchema.nullable(),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative()
});
export type RideRequest = z.infer<typeof RideRequestSchema>;

const RideStatusTransitions: Record<RideStatus, readonly RideStatus[]> = {
  SEARCHING: ['DRIVER_ACCEPTED', 'CANCELLED'],
  DRIVER_ACCEPTED: ['ARRIVED', 'CANCELLED'],
  ARRIVED: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: []
};

export function canTransitionRideStatus(from: RideStatus, to: RideStatus): boolean {
  return RideStatusTransitions[from]?.includes(to) ?? false;
}

export const RideTransitionRequestSchema = z
  .object({
    to: RideStatusSchema
  })
  .strict();
export type RideTransitionRequest = z.infer<typeof RideTransitionRequestSchema>;

export function nextRideStatus(current: RideStatus): RideStatus | null {
  switch (current) {
    case 'SEARCHING':
      return 'DRIVER_ACCEPTED';
    case 'DRIVER_ACCEPTED':
      return 'ARRIVED';
    case 'ARRIVED':
      return 'IN_TRANSIT';
    case 'IN_TRANSIT':
      return 'COMPLETED';
    default:
      return null;
  }
}

export function rideStateToStatus(state: RideState): RideStatus | null {
  switch (state) {
    case 'SEARCHING':
    case 'DRIVER_ACCEPTED':
    case 'ARRIVED':
    case 'IN_TRANSIT':
    case 'COMPLETED':
    case 'CANCELLED':
      return state;
    case 'IDLE':
    case 'MATCH_PROPOSED':
    case 'EXPIRED':
      return null;
    default:
      return null;
  }
}

export function canAdvanceRideState(from: RideState, to: RideState): boolean {
  return canTransitionRide(from, to);
}

export const RideChatMessageCreateSchema = z
  .object({
    body: z.string().trim().min(1).max(500)
  })
  .strict();
export type RideChatMessageCreate = z.infer<typeof RideChatMessageCreateSchema>;

export const RideChatMessageSchema = z.object({
  messageId: z.string().min(1).max(128),
  rideId: z.string().min(1).max(128),
  senderUid: z.string().min(1).max(128),
  senderName: z.string().trim().min(1).max(80),
  body: z.string().trim().min(1).max(500),
  createdAt: z.number().int().nonnegative()
});
export type RideChatMessage = z.infer<typeof RideChatMessageSchema>;

