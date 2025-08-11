import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    demoMode: process.env.DEMO_MODE === 'true' && !process.env.OPENAI_API_KEY,
    hasApiKey: !!process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini'
  });
}
