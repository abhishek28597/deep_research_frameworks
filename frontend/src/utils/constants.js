// Council models from backend config - must match backend/config.py
export const COUNCIL_MODELS = [
  { id: 'openai/gpt-oss-20b', name: 'GPT OSS 20B', description: 'OpenAI OSS Model' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', description: 'Meta Llama Model' },
  { id: 'moonshotai/kimi-k2-instruct-0905', name: 'Kimi K2 Instruct', description: 'Moonshot AI Model' },
];

export const CHAIRMAN_MODEL = {
  id: 'openai/gpt-oss-120b',
  name: 'GPT OSS 120B',
  description: 'OpenAI OSS Chairman Model',
  recommended: true,
};

export const QUICK_PROMPTS = [
  'Web Frameworks',
  'API Security',
  'Architecture',
];

export const API_BASE_URL = 'http://localhost:8000';

// Map model IDs to friendly names
export const MODEL_NAME_MAP = {
  'openai/gpt-oss-20b': 'GPT OSS 20B',
  'llama-3.1-8b-instant': 'Llama 3.1 8B Instant',
  'moonshotai/kimi-k2-instruct-0905': 'Kimi K2 Instruct',
  'openai/gpt-oss-120b': 'GPT OSS 120B',
};

/**
 * Get friendly name for a model ID
 */
export function getModelName(modelId) {
  return MODEL_NAME_MAP[modelId] || modelId;
}

