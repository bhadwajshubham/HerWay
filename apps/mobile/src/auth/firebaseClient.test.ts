import { describe, expect, it } from 'vitest';
import {
  classifyFirebaseAuthError,
  firebaseAuthFailureMessage
} from './firebaseClient.js';
import { FirebaseOtpUnavailableError } from './firebaseClient.js';

describe('Firebase auth failure states', () => {
  it('classifies unavailable configuration', () => {
    expect(classifyFirebaseAuthError(new FirebaseOtpUnavailableError())).toBe('unavailable');
  });

  it('classifies denied, expired, network, and invalid codes', () => {
    expect(classifyFirebaseAuthError({ code: 'auth/popup-closed-by-user' })).toBe('denied');
    expect(classifyFirebaseAuthError({ code: 'auth/code-expired' })).toBe('expired');
    expect(classifyFirebaseAuthError({ code: 'auth/network-request-failed' })).toBe('network');
    expect(classifyFirebaseAuthError({ code: 'auth/invalid-phone-number' })).toBe('invalid');
  });

  it('provides actionable copy for each state', () => {
    expect(firebaseAuthFailureMessage('network')).toContain('retry');
    expect(firebaseAuthFailureMessage('denied')).toContain('denied');
    expect(firebaseAuthFailureMessage('expired')).toContain('new code');
  });
});
