/**
 * AI client — server-side only.
 * Uses OpenRouter as the inference provider.
 * Primary model: Qwen 3 235B (free), fallback: Gemini 2.0 Flash.
 * 
 * All exports keep the same names (groqJSON, isGroqConfigured, etc.)
 * so no other files need to change.
 */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Fast/free: Qwen 3 235B — used when TinyFish already supplied web context (AI just structures
// the data) and for simple generation tasks (quotes, compliance lists, chat, receipt scanning).
const PRIMARY_MODEL = 'google/gemini-2.0-flash-001';

// Accurate: Gemini 2.5 Flash — used for complex analysis (taxes, contracts, business advisor)
// and for any scan endpoint that gets NO TinyFish context and must reason independently.
const ACCURATE_MODEL = 'google/gemini-2.0-flash-001';

// Vision: Gemini Flash handles multimodal inputs natively.
const VISION_MODEL = 'google/gemini-2.0-flash-001';

// Exported so route files can pick the right tier at the call-site.
export const FAST_MODEL_ID = PRIMARY_MODEL;
export const ACCURATE_MODEL_ID = ACCURATE_MODEL;

/**
 * Core identity and behavioral guidelines for all AI calls in Launchpad.
 */
export const LAUNCHPAD_SYSTEM_PROMPT = `You are Launchpad, an AI business advisor built specifically for first-time small business owners and new entrepreneurs.

AUDIENCE:
- People starting or running their first business (sole props, LLCs, freelancers, service businesses)
- Non-experts: not accountants, not lawyers, not financial professionals
- Often overwhelmed, time-poor, and unfamiliar with business or legal jargon
- Operating in the US, typically with 0–10 employees and under $500K annual revenue

TONE AND COMMUNICATION RULES:
- Write like a knowledgeable friend who happens to know business law and accounting — not like a textbook or a lawyer
- Use plain English. If a legal or financial term is unavoidable, define it in the same sentence
- Be direct and specific. Say "You need to file quarterly estimated taxes by April 15, June 15, September 15, and January 15" not "You may have tax obligations"
- Lead with what matters most. Put the most important information first
- Use dollar amounts and concrete numbers whenever possible — not vague ranges
- Avoid hedging language like "you may want to consider" or "it might be advisable" — give a clear recommendation
- Never use jargon without explanation
- Never use jargon without explanation
- Keep explanations short. One clear sentence beats three vague ones
- When something is urgent or risky, say so plainly
- When something is urgent or risky, say so plainly

ACCURACY AND HONESTY RULES:
- Only cite real laws, real agencies, real programs, and real URLs — never fabricate
- If uncertain about a specific threshold or deadline, say "verify this with your state's website"
- Distinguish clearly between federal and state/local requirements
- For tax estimates, use conservative assumptions and note they are estimates
- For funding, only include real and currently active programs
- For contracts, flag genuine risks honestly
- Only cite real laws, real agencies, real programs, and real URLs — never fabricate
- If uncertain about a specific threshold or deadline, say "verify this with your state's website"
- Distinguish clearly between federal and state/local requirements
- For tax estimates, use conservative assumptions and note they are estimates
- For funding, only include real and currently active programs
- For contracts, flag genuine risks honestly

OUTPUT FORMAT:
- Always return valid JSON matching the exact schema requested — no markdown, no extra text
- Use null for unknown fields, never omit required fields
- Use null for unknown fields, never omit required fields
- Dollar amounts as numbers, not strings
- Dates as YYYY-MM-DD strings
- Percentages as integers 0–100, not decimals

IMPORTANT: Do NOT wrap your response in markdown code fences. Do NOT include any thinking or reasoning tags. Return ONLY the raw JSON object.`.trim();
- Percentages as integers 0–100, not decimals

IMPORTANT: Do NOT wrap your response in markdown code fences. Do NOT include any thinking or reasoning tags. Return ONLY the raw JSON object.`.trim();

export function isGroqConfigured() {
  return Boolean(process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY);
}

export function getGroqModel() {
  return process.env.AI_MODEL || PRIMARY_MODEL;
  return process.env.AI_MODEL || PRIMARY_MODEL;
}

export function getGroqVisionModel() {
  return process.env.AI_VISION_MODEL || VISION_MODEL;
  return process.env.AI_VISION_MODEL || VISION_MODEL;
}

function cleanJSON(text) {
  // Strip markdown fences
  let cleaned = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
  // Strip <think>...</think> blocks (Qwen thinking mode)
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  // If it still doesn't start with { or [, try to extract JSON
  if (!cleaned.startsWith('{') && !cleaned.startsWith('[')) {
    const match = cleaned.match(/[\[{][\s\S]*[\]}]/);
    if (match) cleaned = match[0];
  }
  return cleaned;
}

function getHeaders() {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY;
  const isOpenRouter = Boolean(process.env.OPENROUTER_API_KEY);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  if (isOpenRouter) {
    headers['HTTP-Referer'] = process.env.AUTH0_BASE_URL || 'https://safeguard-nu.vercel.app';
    headers['X-Title'] = 'SafeGuard';
  }

  return { headers, isOpenRouter };
}

function getApiUrl() {
  return process.env.OPENROUTER_API_KEY ? OPENROUTER_URL : 'https://api.groq.com/openai/v1/chat/completions';
}


/**
 * Generate a JSON response from a text-only prompt.
 * Uses Gemini 2.0 Flash via OpenRouter.
 */
export async function groqJSON(prompt, options = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not configured');

  const model = options.model || getGroqModel();
  const { headers } = getHeaders();
  const url = getApiUrl();

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      temperature: options.temperature ?? 0.1,
      max_tokens: options.maxTokens ?? 4096,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: LAUNCHPAD_SYSTEM_PROMPT + '\n\nYou are a precise JSON API. Always respond with valid JSON only. No markdown, no explanation, no text outside the JSON object.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`AI error (${model}):`, response.status, text);
    throw new Error(`AI API error ${response.status}`);
  }
  if (!response.ok) {
    const text = await response.text();
    console.error(`AI error (${model}):`, response.status, text);
    throw new Error(`AI API error ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? '';
  const cleaned = cleanJSON(content);
  return JSON.parse(cleaned);
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? '';
  const cleaned = cleanJSON(content);
  return JSON.parse(cleaned);
}

/**
 * Generate a JSON response from a prompt + an image.
 * Uses Gemini 2.0 Flash for vision (handles images natively).
 * Uses Gemini 2.0 Flash for vision (handles images natively).
 */
export async function groqVisionJSON(prompt, base64Image, mimeType, options = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not configured');

  const { headers } = getHeaders();
  const url = getApiUrl();
  const model = options.model || getGroqVisionModel();

  const response = await fetch(url, {
    method: 'POST',
    headers,
    headers,
    body: JSON.stringify({
      model,
      model,
      temperature: options.temperature ?? 0.1,
      max_tokens: options.maxTokens ?? 3072,
      messages: [
        {
          role: 'system',
          content: LAUNCHPAD_SYSTEM_PROMPT + '\n\nYou are a precise JSON API. Always respond with valid JSON only. No markdown, no explanation, no text outside the JSON object.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64Image}` },
            },
            {
              type: 'text',
              text: 'IMPORTANT: Respond with a valid JSON object only. No markdown fences, no explanation.\n\n' + prompt,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('Vision API error:', response.status, text);
    throw new Error(`Vision API error ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? '';
  const cleaned = cleanJSON(content);

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* fall through */ }
      try { return JSON.parse(match[0]); } catch { /* fall through */ }
    }
    throw new Error(`Vision returned invalid JSON: ${cleaned.slice(0, 300)}`);
    throw new Error(`Vision returned invalid JSON: ${cleaned.slice(0, 300)}`);
  }
}

/**
 * Generate plain text from a vision model.
 * Generate plain text from a vision model.
 */
export async function groqVisionText(prompt, base64Image, mimeType, options = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not configured');

  const { headers } = getHeaders();
  const url = getApiUrl();
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not configured');

  const headers = getHeaders();
  const model = options.model || getGroqVisionModel();

  const response = await fetch(url, {
    method: 'POST',
    headers,
    headers,
    body: JSON.stringify({
      model,
      temperature: options.temperature ?? 0.1,
      max_tokens: options.maxTokens ?? 4096,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } },
            { type: 'text', text: prompt },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('Vision Text API error:', response.status, text);
    throw new Error(`Vision Text API error ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}

/**
 * Generate a plain text response.
 * Generate a plain text response.
 */
export async function groqText(prompt, options = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not configured');

  const { headers } = getHeaders();
  const url = getApiUrl();

  const response = await fetch(url, {
    method: 'POST',
    headers,
    headers,
    body: JSON.stringify({
      model,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 2048,
      messages: [
        { role: 'system', content: LAUNCHPAD_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('Text API error:', response.status, text);
    throw new Error(`Text API error ${response.status}`);
    console.error('Text API error:', response.status, text);
    throw new Error(`Text API error ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}
