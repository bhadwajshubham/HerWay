import { describe, expect, it } from 'vitest';
import { getAppVariant } from './appVariant.js';

describe('APP_VARIANT', () => {
  it('uses rider as the safe default', () => {
    expect(getAppVariant(undefined)).toBe('rider');
    expect(getAppVariant('unexpected')).toBe('rider');
  });

  it('allows the explicit captain variant', () => {
    expect(getAppVariant('driver')).toBe('driver');
  });
});
