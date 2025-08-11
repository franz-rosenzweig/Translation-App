import { NextResponse } from "next/server";
import OpenAI from "openai";
import { parseEditPayload } from "@/lib/zod";
import { editSchema } from "@/lib/schema";
import { composePrompt } from "@/lib/prompts";
import { diff_match_patch } from 'diff-match-patch';
import { buildReEnforcementPrompt } from "@/lib/guardrails";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Allow longer operations (large texts) and allow env override
const TIMEOUT = Number(process.env.OPENAI_TIMEOUT_MS) || 240000; // default 240s
const MAX_RETRIES = 1;
const RETRY_DELAY = 1000; // 1 second

async function callOpenAI(messages: any[], signal: AbortSignal, retryCount = 0, model?: string) {
  const chosenModel = model || process.env.OPENAI_MODEL || "gpt-4o-mini";
  try {
    const completion = await openai.chat.completions.create({
      model: chosenModel,
      messages,
      response_format: { type: "json_object" },
    }, { signal });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from OpenAI");

    return JSON.parse(content);
  } catch (error: any) {
    // Fallback for unsupported model (e.g., gpt-5 placeholder) -> retry with gpt-4o-mini once
    const unsupported = (error?.error?.message || error?.message || '').toLowerCase().includes('not found');
    if(unsupported && chosenModel !== 'gpt-4o-mini') {
      return callOpenAI(messages, signal, retryCount, 'gpt-4o-mini');
    }
    if (error.status === 429 || (error.status >= 500 && error.status < 600)) {
      if (retryCount < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, retryCount)));
        return callOpenAI(messages, signal, retryCount + 1, chosenModel);
      }
    }
    throw error;
  }
}

export async function POST(req: Request) {
  const ac = new AbortController();
  const timeout = setTimeout(() => ac.abort(), TIMEOUT);
  const requestStart = Date.now();

  try {
    const body = await req.json();
  const { 
      hebrew, 
      roughEnglish, 
      style, 
      promptOverride, 
      knobs, 
      glossary, 
      model, 
      isRetry, 
      bannedTerms,
      guidelines,
      referenceMaterial,
      sourceLanguage,
      targetLanguage,
      conversationHistory,
      mode = "standard"
    } = body;

    // Demo mode - return mock translation
  // Demo mode only if explicitly enabled AND no real API key present
  if (process.env.DEMO_MODE === 'true' && !process.env.OPENAI_API_KEY) {
      const srcLangNorm = (sourceLanguage || '').toLowerCase();
      const tgtLangNorm = (targetLanguage || '').toLowerCase();
      const sourceText = srcLangNorm.includes('hebrew') ? hebrew : roughEnglish;

      let mockTranslation;
      if (srcLangNorm.includes('english') && tgtLangNorm.includes('hebrew')) {
        // English to Hebrew demo (simple word mapping)
        mockTranslation = "" + (roughEnglish || body.sourceText || 'Hello world').replace(/Hello world/i,'שלום עולם');
      } else if (srcLangNorm.includes('hebrew') && tgtLangNorm.includes('english')) {
        // Hebrew to English demo with naive dictionary so output reflects input
        const dict: Record<string,string> = {
          'שלום':'Hello',
          'עולם':'world',
          'זהו':'This is',
          'זה':'This',
          'מסמך':'a document',
          'בדיקה':'test',
          'למערכת':'for the system',
          'התרגום':'the translation',
          'שלנו':'our'
        };
        const tokens = (sourceText || '').split(/([\s,.!?:;]+)/);
        const translated = tokens.map((t: string)=> {
          const bare = t.replace(/[,.!?:;]/g,'');
            if(dict[bare]) {
              const punct = /[,.!?:;]/.test(t) ? (t.match(/[,.!?:;]/) || [''])[0] : '';
              return dict[bare] + punct;
            }
            return t;
        }).join('').replace(/\s+/g,' ').trim();
        mockTranslation = translated || "Demo translation output - " + (sourceText || 'sample text').slice(0,50) + '...';
      } else {
        // Default mock
        const text = sourceText || body.sourceText || "sample text";
        mockTranslation = "Demo translation output - " + text.slice(0, 50) + "...";
      }

      return NextResponse.json({
        edited_text: mockTranslation,
        notes: "Demo mode: Naive local translation for testing (set DEMO_MODE=false + OPENAI_API_KEY for real).",
        audience_version: mode.startsWith('audience') ? mockTranslation + " (adapted for audience)" : undefined
      });
    }

    // Determine source text based on language selection
    const sourceText = sourceLanguage === 'hebrew' ? hebrew : roughEnglish;
    
    if (!sourceText?.trim()) {
      return NextResponse.json({ error: "Missing source text" }, { status: 400 });
    }

    if (hebrew.length > 15000 || roughEnglish.length > 15000) {
      return NextResponse.json({ error: "Text too long (max 15000 chars)" }, { status: 400 });
    }

    if (glossary && (!Array.isArray(glossary) || glossary.length > 100)) {
      return NextResponse.json({ error: "Invalid glossary format" }, { status: 400 });
    }

  // Always prefer explicit request model else default to gpt-5 (user requirement)
  process.env.OPENAI_MODEL = model || 'gpt-5';

    // Build enforcement prompt if this is a retry with banned terms
    let enforcementPrompt = "";
    if (isRetry && bannedTerms && bannedTerms.length > 0) {
      enforcementPrompt = buildReEnforcementPrompt(
        bannedTerms.map((term: string) => ({ type: 'bannedTerm' as const, term, message: "" }))
      );
    }

    const messages = composePrompt({
      hebrew,
      roughEnglish: roughEnglish || "",
      style,
      promptOverride: promptOverride + (enforcementPrompt ? `\n\n${enforcementPrompt}` : ""),
      knobs,
      glossary,
      guidelines,
      referenceMaterial,
      sourceLanguage,
      targetLanguage,
      conversationHistory,
      mode
    });

  const response = await callOpenAI(messages, ac.signal);
    const validated = parseEditPayload(response);

    // If minimalChanges mode requested, generate explicit span-based change_log if missing or incomplete
    if(knobs && (knobs as any).minimalChanges) {
      try {
        const baseline = sourceLanguage === 'hebrew' ? (roughEnglish || '') : (hebrew || '');
        if(baseline && validated.edited_text) {
          const dmp = new diff_match_patch();
          const diffs = dmp.diff_main(baseline, validated.edited_text);
          dmp.diff_cleanupSemantic(diffs);
          const changes: any[] = [];
          let cursorBase = 0; let cursorNew = 0;
          diffs.forEach((d: [number, string]) => {
            const [op, text] = d;
            if(op === 0) { cursorBase += text.length; cursorNew += text.length; return; }
            if(op === -1) { // deletion
              changes.push({ type: 'delete', before: text, after: '', start: cursorBase, end: cursorBase + text.length });
              cursorBase += text.length;
            } else if(op === 1) { // insertion
              changes.push({ type: 'insert', before: '', after: text, start: cursorBase, end: cursorBase });
              cursorNew += text.length;
            }
          });
          validated.change_log = (validated.change_log || []).concat(changes.slice(0,200));
        }
      } catch(e) {
        console.warn('Minimal change span generation failed', e);
      }
    }

    // Log when audience mode is used (dev only)
    if (process.env.NODE_ENV === 'development' && mode !== 'standard') {
      console.log(`[DEV] Audience mode: ${mode}, response has audience_version:`, !!validated.audience_version);
    }

    // Validate audience version if requested
    if (mode.startsWith('audience') && !validated.audience_version) {
      console.warn('Audience mode requested but no audience_version in response');
    }

    return NextResponse.json(validated);
  } catch (err: any) {
    console.error("API Error:", err);
    
    if (err.name === "AbortError") {
      const abortedByUser = ac.signal.aborted && Date.now() - requestStart < TIMEOUT - 1000;
      return NextResponse.json({ error: abortedByUser ? "Request aborted by client" : "Request timeout" }, { status: 408 });
    }
    
    if (err.status === 429) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }
    
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: err?.status || 500 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
