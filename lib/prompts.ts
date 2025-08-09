export const baseSystemPrompt = `You are an expert translator-editor specializing in Hebrew to American English translation. Your task is to edit the rough English translation for:

1. Clarity: Write clear, concise sentences following Zinsser's principles. Target grade 6-8 reading level unless content demands higher.
2. Americanization: Adapt wording and tone for U.S. readers while preserving meaning.
3. Structure: Preserve the original logical flow and structure.
4. Accuracy: Respect glossary terms. Never invent or add information not present in the source.

IMPORTANT: Return JSON only, matching this exact schema:
{
  "edited_text": "string", // Required: Your edited version
  "change_log": [ // Optional: List significant edits
    {
      "type": "string", // clarity|tone|fidelity|idiom|structure|punctuation|spelling
      "after": "string", // Required: The new text
      "reason": "string"  // Required: Brief explanation
    }
  ],
  "terms_glossary_hits": [ // Optional: Glossary terms found
    {
      "hebrew": "string",
      "chosen_english": "string"
    }
  ],
  "flags": [ // Optional: Issues to note
    {
      "kind": "string", // fidelity|tone|ambiguity|idiom|formatting|terminology
      "note": "string"
    }
  ],
  "audience_version": { // Optional: Only when audience mode requested
    "text": "string", // Audience-optimized adaptation
    "rationale": "string" // Brief reasoning of stylistic approach
  }
}`;

// Strong priority wrapper for promptOverride
function wrapOverride(override: string) {
  return override
    ? `\n\n=== HIGHEST-PRIORITY OVERRIDE DIRECTIVES ===\n${override}\nIMPORTANT: If any earlier instruction conflicts with these override directives, follow THE OVERRIDE. Do NOT weaken or reinterpret them. Only ignore if they would break JSON format or produce unsafe output.\n=== END OVERRIDE ===`
    : "";
}

export function composePrompt({
  hebrew,
  roughEnglish,
  style = "default",
  promptOverride = "",
  knobs = {},
  glossary = [],
  guidelines = "",
  referenceMaterial = "",
  sourceLanguage = "hebrew",
  targetLanguage = "english", 
  conversationHistory = [],
  mode = "standard" // "standard" | "audience-both" | "audience-only"
}: {
  hebrew: string;
  roughEnglish: string;
  style?: string;
  promptOverride?: string;
  knobs?: Record<string, unknown>;
  glossary?: Array<{ hebrew: string; chosen_english: string; note?: string }>;
  guidelines?: string;
  referenceMaterial?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  conversationHistory?: Array<any>;
  mode?: "standard" | "audience-both" | "audience-only";
}) {
  const sourceText = sourceLanguage === 'hebrew' ? hebrew : roughEnglish;
  const targetText = sourceLanguage === 'hebrew' ? roughEnglish : hebrew;
  
  // Build conversation context from history
  const historyContext = conversationHistory.length > 0 
    ? `\n\nRecent conversation context (for reference only):\n${conversationHistory.slice(0, 3).map((entry: any, i: number) => 
        `${i + 1}. ${entry.sourceLanguage} → ${entry.targetLanguage}: "${entry.sourceText.substring(0, 100)}..." → "${entry.result.substring(0, 100)}..."`
      ).join('\n')}`
    : '';

  // Audience adaptation instructions
  const audienceAddendum = mode.startsWith("audience")
    ? `\n\nAUDIENCE ADAPTATION REQUEST: In addition to (or instead of in audience-only mode) the faithful edited_text, produce an "audience_version" that is deliberately optimized for the INTENDED AUDIENCE derived from: guidelines, reference material style signals, and override directives. This version may:
- Restructure for narrative flow
- Adjust tone, emotional resonance, pacing, and idiom
- Strengthen cohesion and voice
BUT it must not introduce factual content absent from the source. Provide concise rationale in audience_version.rationale.
If mode is audience-only, you may omit change_log and other arrays except flags if needed, but must still return edited_text (can mirror audience_version.text if only one is relevant for JSON schema stability).`
    : '';

  const messages = [
    {
      role: "system" as const,
      content: [
        baseSystemPrompt,
        guidelines ? `\n\nTranslation Guidelines:\n${guidelines}` : "",
        referenceMaterial ? `\n\nSTYLE REFERENCE MATERIAL (IMPORTANT - Use these examples to match writing style and tone):\n${referenceMaterial.substring(0, 3000)}${referenceMaterial.length > 3000 ? '\n\n[Reference material truncated for length. Focus on the patterns and style shown above.]' : ''}\n\nPay close attention to the writing style, sentence structure, vocabulary choices, and tone in the reference material above. Match this style in your edited translation.` : "",
        style !== "default" ? `Style: ${style}` : "",
        glossary.length ? `Glossary terms: ${JSON.stringify(glossary)}` : "",
        Object.keys(knobs).length ? `\n\nTRANSLATION INTENSITY SETTINGS (1=minimal, 10=maximum):\n${Object.entries(knobs).map(([key, value]) => {
          const numValue = Number(value);
          switch(key) {
            case 'americanization': return `• Americanization Level ${numValue}/10: ${numValue <= 3 ? 'Preserve original phrasing' : numValue <= 7 ? 'Moderate American adaptation' : 'Strong American idioms and phrasing'}`;
            case 'structureStrictness': return `• Structure Adherence ${numValue}/10: ${numValue <= 3 ? 'Allow flexible restructuring' : numValue <= 7 ? 'Maintain general structure' : 'Preserve exact sentence order'}`;
            case 'toneStrictness': return `• Tone Matching ${numValue}/10: ${numValue <= 3 ? 'Natural English tone' : numValue <= 7 ? 'Balance original and target tone' : 'Preserve exact original tone'}`;
            case 'jargonTolerance': return `• Technical Terms ${numValue}/10: ${numValue <= 3 ? 'Simplify technical language' : numValue <= 7 ? 'Keep moderate jargon' : 'Preserve all technical terminology'}`;
            default: return `${key}: ${value}`;
          }
        }).join('\n')}` : "",
        `Translation direction: ${sourceLanguage} → ${targetLanguage}`,
        audienceAddendum,
        historyContext,
        wrapOverride(promptOverride) // LAST for maximum priority
      ]
        .filter(Boolean)
        .join("\n\n"),
    },
    {
      role: "user" as const,
      content: sourceLanguage === 'hebrew' 
        ? `Hebrew source:\n${sourceText}${targetText ? `\n\nRough ${targetLanguage}:\n${targetText}` : ''}`
        : `${sourceLanguage} source:\n${sourceText}${targetText ? `\n\nRough ${targetLanguage}:\n${targetText}` : ''}`
    },
  ];

  return messages;
}

// Convenience helper for audience-only mode
export function composeAudienceOnlyPrompt(params: Omit<Parameters<typeof composePrompt>[0], 'mode'>) {
  return composePrompt({ ...params, mode: "audience-only" });
}
