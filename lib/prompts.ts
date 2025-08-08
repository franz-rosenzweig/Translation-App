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
  ]
}`;

export function composePrompt({
  hebrew,
  roughEnglish,
  style = "default",
  promptOverride = "",
  knobs = {},
  glossary = []
}: {
  hebrew: string;
  roughEnglish: string;
  style?: string;
  promptOverride?: string;
  knobs?: Record<string, unknown>;
  glossary?: Array<{ hebrew: string; chosen_english: string; note?: string }>;
}) {
  const messages = [
    {
      role: "system" as const,
      content: [
        baseSystemPrompt,
        promptOverride,
        style !== "default" ? `Style: ${style}` : "",
        glossary.length ? `Glossary terms: ${JSON.stringify(glossary)}` : "",
        Object.keys(knobs).length ? `Settings: ${JSON.stringify(knobs)}` : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
    },
    {
      role: "user" as const,
      content: `Hebrew source:\n${hebrew}\n\nRough English:\n${roughEnglish}`,
    },
  ];

  return messages;
}
