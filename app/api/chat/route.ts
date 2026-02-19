import { z } from 'zod';
import type { NextRequest } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL;

const bodySchema = z.object({
  message: z.string().min(1),
});

interface OpenAIChatResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid request body', message: 'Body must be valid JSON' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: 'Invalid request body', message: parsed.error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    if (!OPENAI_API_KEY) {
      throw new Error('Missing OPENAI_API_KEY');
    }
    if (!OPENAI_MODEL) {
      throw new Error('Missing OPENAI_MODEL');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You are Tuffy AI, a crypto market assistant. Provide concise educational guidance and avoid definitive investment recommendations.',
          },
          {
            role: 'user',
            content: parsed.data.message,
          },
        ],
      }),
    });

    const data = (await response.json()) as OpenAIChatResponse;
    if (!response.ok) {
      throw new Error(data?.error?.message || 'OpenAI request failed');
    }

    const reply = data?.choices?.[0]?.message?.content?.trim() || '';
    return new Response(
      JSON.stringify({
        reply,
        disclaimer: 'Not financial advice.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: 'chat_provider_error', message: err?.message || 'Chat provider failed' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
