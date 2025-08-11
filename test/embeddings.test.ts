import { describe, it, expect } from 'vitest';
import { embedSentences, similarityMatrix } from '../lib/embeddings';

describe('embeddings', () => {
  it('generates deterministic pseudo vectors', async () => {
    const v1 = await embedSentences(['hello']);
    const v2 = await embedSentences(['hello']);
    expect(v1[0]).toEqual(v2[0]);
  });

  it('computes similarity matrix', async () => {
    const m = await similarityMatrix(['a','b'], ['a','c']);
    expect(m.length).toBe(2);
    expect(m[0].length).toBe(2);
  });
});
