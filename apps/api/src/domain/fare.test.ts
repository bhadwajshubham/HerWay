import { describe, expect, it } from 'vitest';
import { estimateDistanceKm, estimateFareInr } from './fare.js';

describe('fare estimates', () => {
  it('uses great-circle distance and the fixed ₹11 per km rate', () => {
    const distanceKm = estimateDistanceKm(
      { lat: 0, lng: 0 },
      { lat: 0, lng: 1 }
    );

    expect(distanceKm).toBeCloseTo(111.195, 2);
    expect(estimateFareInr(distanceKm)).toBe(1223.15);
  });

  it('returns zero fare for the same pickup and dropoff coordinates', () => {
    const distanceKm = estimateDistanceKm(
      { lat: 17.4435, lng: 78.3772 },
      { lat: 17.4435, lng: 78.3772 }
    );

    expect(distanceKm).toBe(0);
    expect(estimateFareInr(distanceKm)).toBe(0);
  });

  it('does not exceed valid numeric bounds when points are near antipodal', () => {
    const distanceKm = estimateDistanceKm(
      { lat: 0, lng: 0 },
      { lat: 0, lng: 180 }
    );

    expect(distanceKm).toBeCloseTo(20015.11, 1);
    expect(Number.isFinite(estimateFareInr(distanceKm))).toBe(true);
  });
});
