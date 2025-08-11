// Simple embeddings/semantic similarity stub behind feature flag.
// In real deployment, replace with calls to an embeddings microservice.

export interface EmbeddingOptions { model?: string; }

const CACHE = new Map<string, number[]>();
const DEFAULT_MODEL = 'all-MiniLM-L6-v2';
const REMOTE = process.env.EMBEDDINGS_ENDPOINT;

async function remoteEmbed(texts: string[], model: string): Promise<number[][]> {
  // Batch to avoid very large payloads
  const batchSize = 64;
  const out: number[][] = [];
  for(let i=0;i<texts.length;i+=batchSize) {
    const slice = texts.slice(i, i+batchSize);
    const uncached: string[] = [];
    slice.forEach(t => { if(!CACHE.has(model+':'+t)) uncached.push(t); });
    if(uncached.length) {
      try {
        const res = await fetch(REMOTE as string, {
          method: 'POST',
          headers: { 'Content-Type':'application/json' },
          body: JSON.stringify({ model, texts: uncached })
        });
        if(!res.ok) throw new Error('Remote embed failed '+res.status);
        const json = await res.json();
        if(!Array.isArray(json.vectors) || json.vectors.length !== uncached.length) throw new Error('Malformed embedding response');
        uncached.forEach((t, idx) => CACHE.set(model+':'+t, json.vectors[idx]));
      } catch(e) {
        // Fallback: compute pseudo vectors for uncached
        uncached.forEach(t => CACHE.set(model+':'+t, pseudoVector(t)));
      }
    }
    slice.forEach(t => out.push(CACHE.get(model+':'+t)!));
  }
  return out;
}

function pseudoVector(s: string): number[] {
  const v: number[] = new Array(8).fill(0);
  for(let i=0;i<s.length;i++) v[i%8] += s.charCodeAt(i);
  const norm = Math.sqrt(v.reduce((a,b)=>a+b*b,0)) || 1;
  return v.map(x=> x / norm);
}

export async function embedSentences(sentences: string[], opts: EmbeddingOptions = {}): Promise<number[][]> {
  const model = opts.model || DEFAULT_MODEL;
  if(REMOTE) {
    try { return await remoteEmbed(sentences, model); } catch { /* fallback below */ }
  }
  return sentences.map(pseudoVector);
}

export function cosine(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  for(let i=0;i<a.length;i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  return dot / (Math.sqrt(na)||1) / (Math.sqrt(nb)||1);
}

export async function similarityMatrix(src: string[], tgt: string[]) {
  const [eSrc, eTgt] = await Promise.all([embedSentences(src), embedSentences(tgt)]);
  return eSrc.map(vs => eTgt.map(vt => cosine(vs, vt)));
}
