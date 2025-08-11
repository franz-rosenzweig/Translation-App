// Simple embeddings/semantic similarity stub behind feature flag.
// In real deployment, replace with calls to an embeddings microservice.

export interface EmbeddingOptions {
  model?: string;
}

export async function embedSentences(sentences: string[], _opts: EmbeddingOptions = {}): Promise<number[][]> {
  // Deterministic pseudo-vector: char code sums across positions.
  return sentences.map(s => {
    const v: number[] = new Array(8).fill(0);
    for(let i=0;i<s.length;i++) v[i%8] += s.charCodeAt(i);
    const norm = Math.sqrt(v.reduce((a,b)=>a+b*b,0)) || 1;
    return v.map(x=> x / norm);
  });
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
