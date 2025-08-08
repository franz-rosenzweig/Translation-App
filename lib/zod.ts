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
  flags: z.array(FlagItem).optional()
});

export type EditPayloadT = z.infer<typeof EditPayload>;

export function parseEditPayload(json: unknown): EditPayloadT {
  const r = EditPayload.safeParse(json);
  if (!r.success) {
    const msg = r.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join("; ");
    throw new Error(`Invalid edit payload: ${msg}`);
  }
  return r.data;
}
