import { describe, it, expect } from 'vitest';
import { checkGuardrails } from '../lib/guardrails';

describe('guardrails', () => {
  it('flags length', () => {
    const text = 'a'.repeat(15);
    const res = checkGuardrails(text, { maxInputLength: 10 });
    expect(res.isValid).toBe(false);
    expect(res.violations.find(v=>v.type==='length')).toBeTruthy();
  });
  it('flags banned terms', () => {
    const res = checkGuardrails('Hello secret world', { bannedTerms: ['secret'] });
    expect(res.isValid).toBe(false);
    expect(res.violations.find(v=>v.type==='bannedTerm' && v.term==='secret')).toBeTruthy();
  });
});
