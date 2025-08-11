import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { alignmentCache, preferences } from '../lib/ui-utils';

// Mock localStorage for preferences testing
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('UI utilities', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    alignmentCache.clear();
  });

  describe('AlignmentCache', () => {
    it('caches and retrieves alignment results', () => {
      const sourceText = 'Hello world';
      const targetText = 'Hola mundo';
      const result = { pairs: [], summary: {} };
      
      alignmentCache.set(sourceText, targetText, result);
      const cached = alignmentCache.get(sourceText, targetText);
      
      expect(cached).toEqual(result);
    });
    
    it('returns null for non-existent cache entries', () => {
      const cached = alignmentCache.get('nonexistent', 'text');
      expect(cached).toBeNull();
    });
    
    it('evicts old entries when cache is full', () => {
      // Fill cache beyond max size
      for (let i = 0; i < 60; i++) {
        alignmentCache.set(`source${i}`, `target${i}`, { data: i });
      }
      
      // First entry should be evicted
      const first = alignmentCache.get('source0', 'target0');
      expect(first).toBeNull();
      
      // Last entry should still exist
      const last = alignmentCache.get('source59', 'target59');
      expect(last).toEqual({ data: 59 });
    });
  });
  
  describe('preferences', () => {
    it('gets preference with default value', () => {
      localStorageMock.getItem.mockReturnValue(null);
      const result = preferences.get('testKey', 'defaultValue');
      expect(result).toBe('defaultValue');
    });
    
    it('gets stored preference', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify('storedValue'));
      const result = preferences.get('testKey', 'defaultValue');
      expect(result).toBe('storedValue');
    });
    
    it('sets preference', () => {
      preferences.set('testKey', 'testValue');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'translation-chat-testKey',
        JSON.stringify('testValue')
      );
    });
  });
});
