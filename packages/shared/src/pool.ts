import { z } from 'zod';
import { GeoPointSchema } from './rides.js';

export const PoolStatusSchema = z.enum(['OPEN', 'FULL', 'CLOSED', 'COMPLETED']);
export type PoolStatus = z.infer<typeof PoolStatusSchema>;

export const PoolCreateSchema = z
  .object({
    origin: z.string().trim().min(3).max(240),
    destination: z.string().trim().min(3).max(240),
    originPoint: GeoPointSchema,
    destinationPoint: GeoPointSchema,
    departureAt: z.number().int().nonnegative(),
    seatsTotal: z.number().int().min(2).max(4),
    fareShareInr: z.number().int().nonnegative().max(100000),
    note: z.string().trim().max(240).optional()
  })
  .strict()
  .refine((value) => value.origin.toLowerCase() !== value.destination.toLowerCase(), {
    message: 'Origin and destination must differ'
  });
export type PoolCreate = z.infer<typeof PoolCreateSchema>;

export const PoolMemberSchema = z.object({
  uid: z.string().min(1).max(128),
  displayName: z.string().trim().min(1).max(80),
  joinedAt: z.number().int().nonnegative()
});
export type PoolMember = z.infer<typeof PoolMemberSchema>;

export const PoolSchema = z.object({
  poolId: z.string().min(1).max(128),
  hostUid: z.string().min(1).max(128),
  hostName: z.string().trim().min(1).max(80),
  origin: z.string().trim().min(3).max(240),
  destination: z.string().trim().min(3).max(240),
  originPoint: GeoPointSchema,
  destinationPoint: GeoPointSchema,
  departureAt: z.number().int().nonnegative(),
  seatsTotal: z.number().int().min(2).max(4),
  fareShareInr: z.number().int().nonnegative().max(100000),
  note: z.string().trim().max(240).optional(),
  womenOnly: z.literal(true),
  status: PoolStatusSchema,
  members: z.array(PoolMemberSchema).max(4),
  createdAt: z.number().int().nonnegative()
});
export type Pool = z.infer<typeof PoolSchema>;

export type PoolJoinCheck =
  | { ok: true }
  | { ok: false; reason: 'closed' | 'full' | 'already_member' | 'not_open' | 'self_join' };

export function canJoinPool(
  pool: Pick<Pool, 'status' | 'seatsTotal' | 'members' | 'hostUid'>,
  uid: string
): PoolJoinCheck {
  if (pool.status !== 'OPEN') return { ok: false, reason: 'not_open' };
  if (pool.hostUid === uid) return { ok: false, reason: 'self_join' };
  if (pool.members.some((member) => member.uid === uid)) return { ok: false, reason: 'already_member' };
  if (pool.members.length >= pool.seatsTotal) return { ok: false, reason: 'full' };
  return { ok: true };
}

export function poolStatusAfterJoin(
  seatsTotal: number,
  memberCount: number
): Extract<PoolStatus, 'OPEN' | 'FULL'> {
  return memberCount >= seatsTotal ? 'FULL' : 'OPEN';
}

export const CommunityPostCreateSchema = z
  .object({
    nickname: z
      .string()
      .trim()
      .min(2)
      .max(32)
      .regex(/^[a-zA-Z0-9 _.-]+$/, 'Nickname may use letters, numbers, spaces, dot, dash, underscore'),
    category: z.enum(['share_request', 'route_tip', 'safety_note', 'general']),
    body: z.string().trim().min(3).max(600)
  })
  .strict();
export type CommunityPostCreate = z.infer<typeof CommunityPostCreateSchema>;

export const CommunityPostSchema = z.object({
  postId: z.string().min(1).max(128),
  authorUid: z.string().min(1).max(128),
  nickname: z.string().trim().min(2).max(32),
  category: z.enum(['share_request', 'route_tip', 'safety_note', 'general']),
  body: z.string().trim().min(3).max(600),
  createdAt: z.number().int().nonnegative(),
  upvotes: z.number().int().nonnegative().default(0)
});
export type CommunityPost = z.infer<typeof CommunityPostSchema>;
