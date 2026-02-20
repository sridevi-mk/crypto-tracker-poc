import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { fetchCoinGecko } from '@/lib/coingecko';

const LLM_PROVIDER = (process.env.LLM_PROVIDER || 'openai').toLowerCase();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL;
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'tinyllama';

const bodySchema = z.object({
  message: z.string().min(1).max(2000),
  use_page_context: z.boolean().optional().default(false),
  page_context: z
    .object({
      route: z.string().optional(),
      title: z.string().optional(),
      headings: z.array(z.string()).optional(),
      dataSourceHints: z.array(z.string()).optional(),
      timestamp: z.string().optional(),
    })
    .optional(),
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

interface OllamaChatResponse {
  message?: {
    content?: string;
  };
  error?: string;
}

interface CoinMarketRow {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  last_updated?: string;
}

function isPriceQuestion(message: string): boolean {
  return /\b(price|current price|how much|worth|trading at)\b/i.test(message);
}

function extractRouteCoinId(route?: string): string | null {
  if (!route) return null;
  const m = route.match(/\/coin\/([^/?#]+)/i);
  return m?.[1]?.toLowerCase() || null;
}

function extractCoinHint(message: string): string | null {
  const q = message.toLowerCase();
  const aliases: Record<string, string> = {
    bitcoin: 'bitcoin',
    btc: 'bitcoin',
    ethereum: 'ethereum',
    eth: 'ethereum',
    solana: 'solana',
    sol: 'solana',
    cardano: 'cardano',
    ada: 'cardano',
    dogecoin: 'dogecoin',
    doge: 'dogecoin',
    ripple: 'ripple',
    xrp: 'ripple',
    litecoin: 'litecoin',
    ltc: 'litecoin',
    chainlink: 'chainlink',
    link: 'chainlink',
    polkadot: 'polkadot',
    dot: 'polkadot',
  };
  for (const key of Object.keys(aliases)) {
    const re = new RegExp(`\\b${key}\\b`, 'i');
    if (re.test(q)) return aliases[key];
  }
  return null;
}

function formatUsdPrice(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  const maxDigits = value >= 1 ? 2 : 8;
  return value.toLocaleString(undefined, { maximumFractionDigits: maxDigits });
}

function redactSecrets(input: string): string {
  return input
    .replace(/\bsk-[A-Za-z0-9\-_]{20,}\b/g, '[REDACTED_API_KEY]')
    .replace(/\b0x[a-fA-F0-9]{64}\b/g, '[REDACTED_PRIVATE_KEY]')
    .replace(/\b(?:[a-z]+\s){11,23}[a-z]+\b/gi, (m) => {
      const words = m.trim().split(/\s+/);
      return words.length === 12 || words.length === 24 ? '[REDACTED_SEED_PHRASE]' : m;
    });
}

function sanitizePageContext(ctx: z.infer<typeof bodySchema>['page_context']) {
  if (!ctx) return undefined;
  return {
    route: ctx.route ? redactSecrets(String(ctx.route)).slice(0, 300) : undefined,
    title: ctx.title ? redactSecrets(String(ctx.title)).slice(0, 300) : undefined,
    headings: (ctx.headings || []).slice(0, 10).map((h) => redactSecrets(String(h)).slice(0, 200)),
    dataSourceHints: (ctx.dataSourceHints || []).slice(0, 10).map((h) => redactSecrets(String(h)).slice(0, 300)),
    timestamp: ctx.timestamp ? String(ctx.timestamp).slice(0, 80) : undefined,
  };
}

function isUnsafeRequest(message: string): string | null {
  const m = message.toLowerCase();
  if (/\b(seed phrase|private key|mnemonic)\b/.test(m)) {
    return "I can’t help with handling or exposing wallet secrets like seed phrases or private keys.";
  }
  if (/\b(pump and dump|wash trading|market manipulation|insider trading)\b/.test(m)) {
    return "I can’t help with market manipulation or illegal trading behavior.";
  }
  if (/\b(guaranteed profit|risk[- ]?free return|sure win)\b/.test(m)) {
    return "I can’t provide guaranteed-return or risk-free investment claims.";
  }
  if (/\b(bypass kyc|money laundering|launder money)\b/.test(m)) {
    return "I can’t assist with bypassing regulations or illegal financial activity.";
  }
  if (/\b(exactly what should i buy|tell me what to buy|should i buy now|all in)\b/.test(m)) {
    return "I can’t give direct buy/sell instructions, but I can help you evaluate risk and data.";
  }
  return null;
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
    const message = parsed.data.message.trim();
    const unsafeReply = isUnsafeRequest(message);
    if (unsafeReply) {
      return new Response(
        JSON.stringify({
          reply: unsafeReply,
          disclaimer: 'Not financial advice.',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const safePageContext = sanitizePageContext(parsed.data.page_context);
    const routeCoinId = extractRouteCoinId(safePageContext?.route);
    const hintedCoinId = extractCoinHint(message);
    const coinId = hintedCoinId || routeCoinId;

    if (isPriceQuestion(message) && coinId) {
      try {
        const rows = await fetchCoinGecko<CoinMarketRow[]>('/coins/markets', {
          vs_currency: 'usd',
          ids: coinId,
          per_page: 1,
          page: 1,
          order: 'market_cap_desc',
        });
        const coin = Array.isArray(rows) ? rows[0] : undefined;
        if (coin && typeof coin.current_price === 'number') {
          const reply = `${coin.name} (${coin.symbol.toUpperCase()}) is currently trading at $${formatUsdPrice(coin.current_price)} USD.` +
            (coin.last_updated ? ` Last updated: ${new Date(coin.last_updated).toLocaleString()}.` : '');
          return new Response(
            JSON.stringify({
              reply,
              disclaimer: 'Not financial advice.',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
      } catch {
        // Fall back to model response if live fetch fails.
      }
    }

    const contextBlock =
      parsed.data.use_page_context && safePageContext
        ? `Page context (JSON):\n${JSON.stringify(safePageContext, null, 2)}`
        : '';
    const userContent = contextBlock
      ? `${parsed.data.message}\n\n${contextBlock}`
      : parsed.data.message;

    const systemPrompt =
      'You are Tuffy AI, a crypto market assistant. Use provided page context when available. ' +
      'Provide concise educational guidance, do not provide direct buy/sell instructions, do not claim guaranteed returns, ' +
      'and do not assist illegal or manipulative activity. If context lacks live price data, say that clearly. ' +
      'Keep responses crisp: max 3 short bullet points or 2 short sentences.';

    let reply = '';

    if (LLM_PROVIDER === 'ollama') {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
          options: {
            num_predict: 160,
            temperature: 0.2,
          },
          stream: false,
        }),
      });

      const data = (await response.json()) as OllamaChatResponse;
      if (!response.ok) {
        throw new Error(data?.error || 'Ollama request failed');
      }
      reply = (data?.message?.content?.trim() || '').slice(0, 2000);
    } else {
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
          max_tokens: 180,
          temperature: 0.2,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
        }),
      });

      const data = (await response.json()) as OpenAIChatResponse;
      if (!response.ok) {
        throw new Error(data?.error?.message || 'OpenAI request failed');
      }

      reply = (data?.choices?.[0]?.message?.content?.trim() || '').slice(0, 600);
    }

    // Hard cap for crisp output regardless of provider.
    reply = reply.slice(0, 600);

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
