export const MIN_SCHEDULE_LEAD_MS = 30 * 60 * 1000;
export const MAX_SCHEDULE_LEAD_MS = 30 * 24 * 60 * 60 * 1000;

export type ScheduledTimeValidation =
  | { ok: true; scheduledAt: Date }
  | { ok: false; reason: 'TOO_SOON' | 'TOO_FAR' };

export function validateScheduledAt(value: string, nowMs: number): ScheduledTimeValidation {
  const scheduledAtMs = Date.parse(value);
  const leadMs = scheduledAtMs - nowMs;
  if (!Number.isFinite(scheduledAtMs) || leadMs < MIN_SCHEDULE_LEAD_MS) {
    return { ok: false, reason: 'TOO_SOON' };
  }
  if (leadMs > MAX_SCHEDULE_LEAD_MS) return { ok: false, reason: 'TOO_FAR' };
  return { ok: true, scheduledAt: new Date(scheduledAtMs) };
}
