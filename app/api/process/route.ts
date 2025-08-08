import { NextResponse } from "next/server";
import { parseEditPayload } from "@/lib/zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body || (typeof body.hebrew !== "string" && typeof body.roughEnglish !== "string")) {
      return NextResponse.json({ error: "Bad input" }, { status: 400 });
    }

    const stub = {
      edited_text: (body.roughEnglish || "").trim() || "Edited text would appear here.",
      change_log: [],
      terms_glossary_hits: [],
      flags: []
    };

    const validated = parseEditPayload(stub);

    return NextResponse.json(validated);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}
