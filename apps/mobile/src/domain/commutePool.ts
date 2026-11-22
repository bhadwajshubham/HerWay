import type { Pool } from '@herway/shared';

export type PoolVehicleMode = 'carpool' | 'scooty_pool';
export type CommuteDay = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';
export type TodayCommuteStatus = 'riding' | 'wfh' | 'delayed';

export const COMMUTE_DAYS: readonly CommuteDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export interface CommutePoolMeta {
  vehicleMode: PoolVehicleMode;
  logoutWindow: string;
  activeDays: CommuteDay[];
  monthlyEstimateInr: number;
  noteText: string;
}

const DEFAULT_DAYS: CommuteDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export function computeMonthlySplitInr(
  fareShareInr: number,
  activeDaysCount: number,
  weeksPerMonth = 4
): number {
  const safeFare = Math.max(0, Math.round(fareShareInr));
  const sessionsPerMonth = Math.max(1, activeDaysCount) * weeksPerMonth;
  return safeFare * sessionsPerMonth;
}

export function encodeCommutePoolNote(meta: {
  vehicleMode: PoolVehicleMode;
  logoutWindow: string;
  activeDays: CommuteDay[];
  fareShareInr: number;
  noteText?: string;
}): string | undefined {
  const days = meta.activeDays.length > 0 ? meta.activeDays : DEFAULT_DAYS;
  const monthly = computeMonthlySplitInr(meta.fareShareInr, days.length);
  const modeLabel = meta.vehicleMode === 'scooty_pool' ? 'Scooty-pool' : 'Carpool';
  const windowText = meta.logoutWindow.trim() || '6:15–6:45 PM';
  const extra = meta.noteText?.trim();
  const header = `[${modeLabel} · ${windowText} · ${days.join('/')} · ~₹${monthly}/mo]`;
  return extra ? `${header} ${extra}` : header;
}

export function parseCommutePoolMeta(
  pool: Pick<Pool, 'note' | 'seatsTotal' | 'fareShareInr'>
): CommutePoolMeta {
  const raw = pool.note ?? '';
  const vehicleMode: PoolVehicleMode =
    raw.toLowerCase().includes('scooty') || pool.seatsTotal === 2 ? 'scooty_pool' : 'carpool';

  const bracketMatch = /^\[([^\]]+)\]\s*(.*)$/.exec(raw);
  const metaPart = bracketMatch?.[1] ?? '';
  const noteText = bracketMatch ? (bracketMatch[2] ?? '').trim() : raw.trim();

  const segments = metaPart.split('·').map((s) => s.trim()).filter(Boolean);
  const logoutWindow =
    segments.find((seg) => /\d{1,2}:\d{2}/.test(seg) || /am|pm/i.test(seg)) ?? '6:15–6:45 PM';

  const daysSeg = segments.find((seg) =>
    COMMUTE_DAYS.some((d) => new RegExp(`\\b${d}\\b`).test(seg))
  );
  const parsedDays = COMMUTE_DAYS.filter((d) =>
    daysSeg ? new RegExp(`\\b${d}\\b`).test(daysSeg) : false
  );
  const activeDays: CommuteDay[] = parsedDays.length > 0 ? parsedDays : [...DEFAULT_DAYS];

  const monthlyEstimateInr = computeMonthlySplitInr(pool.fareShareInr, activeDays.length);

  return {
    vehicleMode,
    logoutWindow,
    activeDays,
    monthlyEstimateInr,
    noteText
  };
}