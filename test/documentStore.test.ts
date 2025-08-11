import { describe, it, expect } from 'vitest';
import { splitSentences, alignSourceDirect } from '../lib/documentStore';

describe('documentStore helpers', () => {
  it('splits sentences and preserves abbreviations', () => {
    const text = 'Dr. Smith went home. He slept.';
    const parts = splitSentences(text);
    expect(parts.length).toBeGreaterThan(1);
    expect(parts[0]).toMatch(/Dr. Smith went home\./);
  });

  it('aligns 1:1 sentences', () => {
    const src = 'One. Two.';
    const tgt = 'Uno. Dos.';
    const pairs = alignSourceDirect(src, tgt);
    expect(pairs.length).toBe(2);
    expect(pairs[0].source).toMatch(/One/);
  });
});
