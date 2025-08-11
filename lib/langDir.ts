export function langDir(code: string): 'rtl' | 'ltr' {
  const rtl = new Set(['he', 'ar', 'fa', 'ur']);
  return rtl.has(code.toLowerCase()) ? 'rtl' : 'ltr';
}
