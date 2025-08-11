import { describe, it, expect } from 'vitest';

// Test export functionality patterns
describe('export functionality', () => {
  it('strips tracked change artifacts correctly', () => {
    const contentWithTracking = `
      Some text <span data-change-id="123">tracked change</span> more text
      <del data-change-id="456">deleted</del> content
    `;
    
    // Simulate stripping logic from export route
    const stripped = contentWithTracking
      .replace(/<span[^>]*data-change-id[^>]*>(.*?)<\/span>/g, '$1')
      .replace(/<del[^>]*data-change-id[^>]*>.*?<\/del>/g, '');
    
    expect(stripped).not.toContain('data-change-id');
    expect(stripped).toContain('tracked change');
    expect(stripped).not.toContain('deleted');
  });
  
  it('formats glossary summary correctly', () => {
    const mockGlossaryData = [
      { term: 'hello', translation: 'hola' },
      { term: 'world', translation: 'mundo' }
    ];
    
    const summary = mockGlossaryData
      .map(g => `${g.term}: ${g.translation}`)
      .join('\n');
    
    expect(summary).toContain('hello: hola');
    expect(summary).toContain('world: mundo');
  });
});
