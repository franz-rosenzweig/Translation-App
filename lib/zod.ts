import { z } from "zod";

export const ChangeLogItem = z.object({
  line: z.number().int().optional(),
  type: z.string(),
  before: z.string().optional(),
  after: z.string(),
  reason: z.string()
});

export const GlossaryHit = z.object({
  hebrew: z.string(),
  chosen_english: z.string(),
  note: z.string().optional()
});

export const FlagItem = z.object({
  kind: z.string(),
  note: z.string()
});

export const EditPayload = z.object({
  edited_text: z.string(),
  change_log: z.array(ChangeLogItem).optional(),
  terms_glossary_hits: z.array(GlossaryHit).optional(),
  flags: z.array(FlagItem).optional(),
  audience_version: z.object({
    text: z.string(),
    rationale: z.string().optional()
  }).optional()
}).passthrough(); // Allow unknown fields to pass through gracefully

export type EditPayloadT = z.infer<typeof EditPayload>;

export function parseEditPayload(json: unknown): EditPayloadT {
  const r = EditPayload.safeParse(json);
  if (!r.success) {
    console.warn('Edit payload validation failed, attempting graceful fallback:', r.error);
    
    // Graceful fallback - extract what we can
    const fallback: any = {
      edited_text: typeof json === 'object' && json !== null && 'edited_text' in json 
        ? String((json as any).edited_text) 
        : typeof json === 'string' ? json : '',
      change_log: [],
      terms_glossary_hits: [],
      flags: []
    };
    
    // Try to extract audience_version if present
    if (typeof json === 'object' && json !== null && 'audience_version' in json) {
      const av = (json as any).audience_version;
      if (typeof av === 'object' && av !== null && 'text' in av) {
        fallback.audience_version = {
          text: String(av.text),
          rationale: av.rationale ? String(av.rationale) : undefined
        };
      }
    }
    
    return fallback as EditPayloadT;
  }
  return r.data;
}
