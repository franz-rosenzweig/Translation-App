import { NextResponse } from 'next/server';
import { repo } from '@/lib/repository';

function stripHtml(html: string) { return html.replace(/<[^>]+>/g,' '); }
function tokenize(text: string) { return text.split(/\s+/).filter(Boolean); }
function levenshtein(a: string, b: string) {
  const m = a.length, n = b.length;
  const dp = Array.from({length:m+1},()=> new Array(n+1).fill(0));
  for(let i=0;i<=m;i++) dp[i][0]=i;
  for(let j=0;j<=n;j++) dp[0][j]=j;
  for(let i=1;i<=m;i++) for(let j=1;j<=n;j++) {
    dp[i][j] = a[i-1]===b[j-1]? dp[i-1][j-1] : 1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
  }
  return dp[m][n];
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(()=>({}));
    const { text } = body; // adapted text (HTML or plain)
    if(!text) return NextResponse.json({ error: 'Missing text' }, { status: 400 });
    const plain = stripHtml(text);
    const lower = plain.toLowerCase();
    const terms = await repo.listGlossary(params.id);
    const warnings: any[] = [];
    // Build char index mapping for occurrences
    for(const term of terms) {
      const expected = term.chosenEnglish.trim();
      if(!expected) continue;
      const expectedLower = expected.toLowerCase();
      let idx = 0; const occ: Array<{ start: number; end: number }> = [];
      while((idx = lower.indexOf(expectedLower, idx)) !== -1) {
        occ.push({ start: idx, end: idx + expected.length });
        idx += expected.length;
      }
      if(occ.length === 0) {
        warnings.push({ type: 'missing', hebrew: term.hebrew, expected, occurrences: [] });
      } else {
        // Evaluate potential variants: look for near matches (distance ratio < 0.4) per token span of same length
        warnings.push({ type: 'ok', hebrew: term.hebrew, expected, occurrences: occ });
      }
    }
    // Basic mismatch: tokens with edit distance small but not exact expected (approx synonyms). This is placeholder.
    // We scan windows in text where distance <=2 for expected length >=5 and not exact.
    for(const term of terms) {
      const expected = term.chosenEnglish.trim();
      if(expected.length < 5) continue;
      const expectedLower = expected.toLowerCase();
      const windowSize = expected.length;
      for(let i=0;i<=lower.length - windowSize;i++) {
        const slice = lower.slice(i, i+windowSize);
        if(slice === expectedLower) continue;
        const dist = levenshtein(slice, expectedLower);
        if(dist>0 && dist <= Math.floor(windowSize*0.3)) {
          // only add if not already covered by ok/missing
            if(!warnings.some(w => w.expected === expected && w.occurrences?.some((o:any)=> i>=o.start && i<o.end))) {
              warnings.push({ type: 'mismatch', hebrew: term.hebrew, expected, near: slice, occurrences: [{ start: i, end: i+windowSize }] });
            }
        }
      }
    }
    return NextResponse.json({ warnings: warnings.filter(w=> w.type !== 'ok'), count: warnings.filter(w=> w.type !== 'ok').length });
  } catch(e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
