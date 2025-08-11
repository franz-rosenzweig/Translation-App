import { describe, it, expect } from 'vitest';
import { diffWords } from '../lib/diff';

describe('diffWords', () => {
  it('computes simple insert/delete', () => {
    const ops = diffWords('hello world', 'hello brave new world');
    const types = ops.map(o=>o.type+':'+o.text);
    expect(types).toContain('equal:hello');
    expect(types.join('')).toContain('insert:brave');
    expect(types.join('')).toContain('insert:new');
  });

  it('handles empty input', () => {
    const ops = diffWords('', 'abc');
    expect(ops.some(o=>o.type==='insert')).toBe(true);
  });
});
