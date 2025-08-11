import { NextRequest, NextResponse } from 'next/server';
import { getDocument, alignSourceDirect, splitSentences } from '@/lib/documentStore';
import { similarityMatrix } from '@/lib/embeddings';
import { repo } from '@/lib/repository';
const useDb = process.env.FEATURE_DB === '1';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const doc: any = useDb ? await repo.getDocument(params.id) : getDocument(params.id);
  if(!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  let directText = doc.directTranslation;
  if(useDb && !directText && doc.directTranslationVersionId) {
    // fetch version content
    const versions = await repo.getVersions(doc.id);
  const directV = versions.find((v:any)=>v.id===doc.directTranslationVersionId);
    directText = directV?.content;
  }
  if(!directText) return NextResponse.json({ alignment: [] });
  let rawPairs;
  if(process.env.FEATURE_EMBED_ALIGN === '1') {
    const srcSent = splitSentences(doc.sourceText);
    const tgtSent = splitSentences(directText);
    const sim = await similarityMatrix(srcSent, tgtSent);
    const usedTargets = new Set<number>();
    rawPairs = srcSent.map((s, i) => {
      let bestIdx = -1; let best = -1;
      for(let j=0;j<tgtSent.length;j++) {
        if(sim[i][j] > best) { best = sim[i][j]; bestIdx = j; }
      }
      if(bestIdx>=0) usedTargets.add(bestIdx);
      return { sourceIndex: i, targetIndex: bestIdx, source: s, target: bestIdx>=0 ? tgtSent[bestIdx] : '', similarity: bestIdx>=0 ? best : 0 };
    });
    // Add unmatched target sentences
    for(let j=0;j<tgtSent.length;j++) {
      if(!usedTargets.has(j)) {
        rawPairs.push({ sourceIndex: -1, targetIndex: j, source: '', target: tgtSent[j], similarity: 0 });
      }
    }
  } else {
    rawPairs = alignSourceDirect(doc.sourceText, directText);
  }
  const pairs = rawPairs.map((p:any) => ({
    ...p,
    tier: p.similarity >= 0.85 ? 'good' : p.similarity >= 0.6 ? 'fuzzy' : 'poor',
    unmatched: p.unmatched || p.sourceIndex === -1 || p.targetIndex === -1 || !p.source || !p.target
  }));
  return NextResponse.json({ alignment: pairs, meta: { sourceCount: splitSentences(doc.sourceText).length, targetCount: splitSentences(directText).length } });
}
