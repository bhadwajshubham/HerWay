import { describe, expect, it } from 'vitest';
import {
  CircleParamsSchema,
  isVerifiedOrganizationEmail,
  MembershipRequestBodySchema
} from './community.js';

describe('Work Circle membership boundary', () => {
  it('accepts only an exact verified email-domain match', () => {
    expect(isVerifiedOrganizationEmail('person@northstar.example', true, 'northstar.example')).toBe(true);
    expect(isVerifiedOrganizationEmail('person@northstar.example', false, 'northstar.example')).toBe(false);
    expect(isVerifiedOrganizationEmail('person@sub.northstar.example', true, 'northstar.example')).toBe(false);
    expect(isVerifiedOrganizationEmail('person@northstar.example.attacker.test', true, 'northstar.example')).toBe(false);
    expect(isVerifiedOrganizationEmail('person@northstar.example', true, 'other.example')).toBe(false);
    expect(isVerifiedOrganizationEmail('person@gmail.com', true, 'gmail.com')).toBe(false);
    expect(isVerifiedOrganizationEmail('person@mail.gmail.com', true, 'mail.gmail.com')).toBe(false);
  });

  it('validates Circle IDs and forbids client-selected roles or membership status', () => {
    expect(CircleParamsSchema.safeParse({ circleId: 'circle-123' }).success).toBe(true);
    expect(CircleParamsSchema.safeParse({ circleId: 'circle/other' }).success).toBe(false);
    expect(MembershipRequestBodySchema.safeParse({}).success).toBe(true);
    expect(MembershipRequestBodySchema.safeParse({ role: 'admin' }).success).toBe(false);
    expect(MembershipRequestBodySchema.safeParse({ status: 'approved' }).success).toBe(false);
  });
});
