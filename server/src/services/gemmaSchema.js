import { z } from 'zod';

export const DetectionItem = z.object({
  name: z.string().min(1),
  present: z.boolean(),
  correct: z.boolean(),
  issue: z.string().nullable().optional().transform((v) => v || ''),
  confidence: z.coerce.number().min(0).max(1).catch(0.5),
});

export const CheckResult = z.object({
  items: z.array(DetectionItem).default([]),
  step_ok: z.boolean(),
  feedback_en: z.string().min(1),
  feedback_sw: z.string().min(1),
  risk_flags: z.array(z.string()).default([]),
});

export const CoachingResult = z.object({
  coaching_en: z.string().min(1),
  coaching_sw: z.string().min(1),
});

/** Pull the first JSON object out of a model reply (handles ```json fences and thinking preambles). */
export function extractJson(text) {
  if (!text || typeof text !== 'string') throw new Error('empty_response');
  const cleaned = text.replace(/<\|channel>thought[\s\S]*?<channel\|>/g, '').replace(/```(?:json)?/gi, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('no_json_found');
  return JSON.parse(cleaned.slice(start, end + 1));
}

export function parseWith(schema, text) {
  const raw = extractJson(text);
  return schema.parse(raw);
}
