/**
 * Utility hooks and helpers for UI polish
 */
import { useCallback, useRef, useEffect } from 'react';

/**
 * Debounces a function call
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return debouncedCallback as T;
}

/**
 * Cache implementation for alignment results
 */
class AlignmentCache {
  private cache = new Map<string, any>();
  private maxSize = 50; // Prevent memory bloat
  
  private getCacheKey(sourceText: string, targetText: string): string {
    // Simple hash-like key
    return btoa(sourceText.slice(0, 100) + '::' + targetText.slice(0, 100));
  }
  
  get(sourceText: string, targetText: string): any | null {
    const key = this.getCacheKey(sourceText, targetText);
    return this.cache.get(key) || null;
  }
  
  set(sourceText: string, targetText: string, result: any): void {
    const key = this.getCacheKey(sourceText, targetText);
    
    // LRU-style eviction
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, result);
  }
  
  clear(): void {
    this.cache.clear();
  }
}

export const alignmentCache = new AlignmentCache();

/**
 * Local storage utility for user preferences
 */
export const preferences = {
  get(key: string, defaultValue: any = null) {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const stored = localStorage.getItem(`translation-chat-${key}`);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  
  set(key: string, value: any) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`translation-chat-${key}`, JSON.stringify(value));
    } catch {
      // Ignore storage errors
    }
  }
};
