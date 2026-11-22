import { describe, expect, it } from 'vitest';
import { interpolatePoint, tripProgress } from './trip';

describe('interpolatePoint', () => {
  const from = { lat: 17.44, lng: 78.37 };
  const to = { lat: 17.24, lng: 78.42 };

  it('returns the origin at progress zero', () => {
    expect(interpolatePoint(from, to, 0)).toEqual(from);
  });

  it('returns the destination at progress one', () => {
    expect(interpolatePoint(from, to, 1)).toEqual(to);
  });

  it('clamps out-of-range progress', () => {
    expect(interpolatePoint(from, to, -2)).toEqual(from);
    expect(interpolatePoint(from, to, 5)).toEqual(to);
  });

  it('interpolates linearly', () => {
    const mid = interpolatePoint(from, to, 0.5);
    expect(mid.lat).toBeCloseTo(17.34, 5);
    expect(mid.lng).toBeCloseTo(78.395, 5);
  });
});

describe('tripProgress', () => {
  it('returns zero before the start', () => {
    expect(tripProgress(1000, 500, 1000)).toBe(0);
  });

  it('returns one after the duration', () => {
    expect(tripProgress(1000, 5000, 1000)).toBe(1);
  });

  it('returns a fraction within the duration', () => {
    expect(tripProgress(1000, 1500, 1000)).toBe(0.5);
  });

  it('treats a non-positive duration as complete', () => {
    expect(tripProgress(1000, 1000, 0)).toBe(1);
  });
});
