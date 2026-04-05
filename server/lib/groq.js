/**
 * Groq AI helper — shared by all /api/ai/* routes.
 * Uses Groq chat completions to generate structured JSON.
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export function isGroqConfigured() {
  return Boolean(process.env.GROQ_API_KEY);
}

export function getGroqModel() {
  return process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
}

export function getGroqVisionModel() {
  return process.env.GROQ_VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct';
}

export async function groqJSON(prompt, options = {}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not configured');

  const models = [
    options.model || getGroqModel(),
    'llama-3.1-8b-instant', // fallback smaller model
  ];

  let lastError;
  for (const model of models) {
    try {
      const response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: options.temperature ?? 0.1,
          max_tokens: options.maxTokens ?? 4000,
          messages: [
            { role: 'system', content: 'You are a helpful assistant. Return ONLY valid JSON with no markdown, no backticks, no explanation.' },
            { role: 'user', content: prompt },
          ],
        }),
      });

      if (response.status === 429) {
        const errBody = await response.text();
        console.error(`Groq rate limit on ${model}:`, errBody);
        lastError = new Error(`Rate limited on ${model}`);
        continue; // try next model
      }

      if (!response.ok) {
        const text = await response.text();
        console.error(`Groq API error on ${model}:`, response.status, text);
        lastError = new Error(`Groq API error ${response.status}`);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      return JSON.parse(cleaned);
    } catch (err) {
      lastError = err;
      console.error(`Groq ${model} failed:`, err.message);
    }
  }

  throw lastError || new Error('All Groq models failed');
}

export async function groqVisionJSON(prompt, base64Image, mimeType, options = {}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not configured');

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options.model || getGroqVisionModel(),
      temperature: options.temperature ?? 0.1,
      max_tokens: options.maxTokens ?? 4000,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('Groq Vision API error:', response.status, text);
    throw new Error(`Groq Vision API error ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  return JSON.parse(cleaned);
}
