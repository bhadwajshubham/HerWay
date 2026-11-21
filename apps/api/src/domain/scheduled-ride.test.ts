import { describe, expect, it } from 'vitest';
import { validateScheduledAt } from './scheduled-ride.js';

describe('scheduled ride time validation', () => {
  const now = Date.parse('2026-11-22T10:00:00.000Z');

  it('accepts a future time within the booking window', () => {
    expect(validateScheduledAt('2026-11-22T16:00:00+05:30', now)).toMatchObject({
      ok: true,
      scheduledAt: new Date('2026-11-22T10:30:00.000Z')
    });
  });

  it('rejects a time less than 30 minutes away or in the past', () => {
    expect(validateScheduledAt('2026-11-22T10:29:59.999Z', now)).toEqual({
      ok: false,
      reason: 'TOO_SOON'
    });
    expect(validateScheduledAt('2026-11-22T09:00:00Z', now)).toEqual({
      ok: false,
      reason: 'TOO_SOON'
    });
  });

  it('rejects times beyond 30 days', () => {
    expect(validateScheduledAt('2026-12-23T10:00:00Z', now)).toEqual({
      ok: false,
      reason: 'TOO_FAR'
    });
  });

  it('accepts exact minimum and maximum lead times and rejects an invalid timestamp', () => {
    expect(validateScheduledAt('2026-11-22T10:30:00.000Z', now).ok).toBe(true);
    expect(validateScheduledAt('2026-12-22T10:00:00.000Z', now).ok).toBe(true);
    expect(validateScheduledAt('invalid', now)).toEqual({ ok: false, reason: 'TOO_SOON' });
  });
});
