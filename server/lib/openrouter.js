/**
 * openrouter.js — re-exports groq.js functions under their canonical names.
 * groq.js already calls OpenRouter under the hood; this file just gives
 * the new routes a stable, correctly-named import surface.
 */
export {
  groqJSON as aiJSON,
  groqVisionJSON as aiVisionJSON,
  groqText as aiText,
  isGroqConfigured as isAIConfigured,
  LAUNCHPAD_SYSTEM_PROMPT,
  FAST_MODEL_ID,
  ACCURATE_MODEL_ID,
} from './groq.js';
