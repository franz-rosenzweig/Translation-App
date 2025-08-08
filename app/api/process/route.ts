import { NextResponse } from "next/server";
import OpenAI from "openai";
import { parseEditPayload } from "@/lib/zod";
import { editSchema } from "@/lib/schema";
import { composePrompt } from "@/lib/prompts";
import { buildReEnforcementPrompt } from "@/lib/guardrails";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const TIMEOUT = 60000; // 60 seconds
const MAX_RETRIES = 1;
const RETRY_DELAY = 1000; // 1 second

async function callOpenAI(messages: any[], signal: AbortSignal, retryCount = 0) {
  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      messages,
      response_format: { type: "json_object" },
    }, { signal });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from OpenAI");

    return JSON.parse(content);
  } catch (error: any) {
    if (error.status === 429 || (error.status >= 500 && error.status < 600)) {
      if (retryCount < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, retryCount)));
        return callOpenAI(messages, signal, retryCount + 1);
      }
    }
    throw error;
  }
}

export async function POST(req: Request) {
  const ac = new AbortController();
  const timeout = setTimeout(() => ac.abort(), TIMEOUT);

  try {
    const body = await req.json();
    const { hebrew, roughEnglish, style, promptOverride, knobs, glossary, model, isRetry, bannedTerms } = body;

    if (!hebrew?.trim() || !roughEnglish?.trim()) {
      return NextResponse.json({ error: "Missing hebrew or roughEnglish text" }, { status: 400 });
    }

    if (hebrew.length > 10000 || roughEnglish.length > 10000) {
      return NextResponse.json({ error: "Text too long (max 10000 chars)" }, { status: 400 });
    }

    if (glossary && (!Array.isArray(glossary) || glossary.length > 100)) {
      return NextResponse.json({ error: "Invalid glossary format" }, { status: 400 });
    }

    // Override model if provided in request
    if (model) process.env.OPENAI_MODEL = model;

    // Build enforcement prompt if this is a retry with banned terms
    let enforcementPrompt = "";
    if (isRetry && bannedTerms && bannedTerms.length > 0) {
      enforcementPrompt = buildReEnforcementPrompt(
        bannedTerms.map((term: string) => ({ type: 'bannedTerm' as const, term, message: "" }))
      );
    }

    const messages = composePrompt({
      hebrew,
      roughEnglish,
      style,
      promptOverride: promptOverride + (enforcementPrompt ? `\n\n${enforcementPrompt}` : ""),
      knobs,
      glossary,
    });

    const response = await callOpenAI(messages, ac.signal);
    const validated = parseEditPayload(response);

    return NextResponse.json(validated);
  } catch (err: any) {
    console.error("API Error:", err);
    
    if (err.name === "AbortError") {
      return NextResponse.json({ error: "Request timeout" }, { status: 408 });
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
