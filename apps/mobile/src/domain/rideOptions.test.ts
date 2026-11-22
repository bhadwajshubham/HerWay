import { describe, expect, it } from 'vitest';
import { sortRideOptions } from './rideOptions';

const options = [
  { id: 'calm', title: 'Calm', detail: '4 min', price: 180, eta: 4 },
  { id: 'comfort', title: 'Comfort', detail: '6 min', price: 245, eta: 6 },
  { id: 'quick', title: 'Quick', detail: '8 min', price: 150, eta: 8 }
] as const;

describe('sortRideOptions', () => {
  it('keeps the recommended order', () => {
    expect(sortRideOptions(options, 'recommended').map((option) => option.id)).toEqual([
      'calm',
      'comfort',
      'quick'
    ]);
  });

  it('sorts by price', () => {
    expect(sortRideOptions(options, 'price').map((option) => option.id)).toEqual([
      'quick',
      'calm',
      'comfort'
    ]);
  });

  it('sorts by arrival', () => {
    expect(sortRideOptions(options, 'arrival').map((option) => option.id)).toEqual([
      'calm',
      'comfort',
      'quick'
    ]);
  });
});
