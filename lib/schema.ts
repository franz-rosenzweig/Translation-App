export const editSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    edited_text: { type: "string" },
    change_log: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          line: { type: "integer" },
          type: { type: "string" }, // clarity|tone|fidelity|idiom|structure|punctuation|spelling
          before: { type: "string" },
          after: { type: "string" },
          reason: { type: "string" }
        },
        required: ["type", "after", "reason"]
      }
    },
    terms_glossary_hits: {
      type: "array",
      items: {
        type: "object",
        properties: {
          hebrew: { type: "string" },
          chosen_english: { type: "string" },
          note: { type: "string" }
        },
        required: ["hebrew", "chosen_english"]
      }
    },
    flags: {
      type: "array",
      items: {
        type: "object",
        properties: {
          kind: { type: "string" }, // fidelity|tone|ambiguity|idiom|formatting|terminology
          note: { type: "string" }
        },
        required: ["kind", "note"]
      }
    }
  },
  required: ["edited_text"]
} as const;
