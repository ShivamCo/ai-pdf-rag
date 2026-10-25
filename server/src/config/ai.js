import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { env } from './env.js';

let anthropicClient = null;

export const getAnthropicClient = () => {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not defined.');
  }
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
};

// Claude has no embeddings API, so indexing and retrieval stay on Gemini.
export const getGoogleEmbeddingsClient = (modelName = 'gemini-embedding-2') => {
  if (!env.GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY environment variable is not defined.');
  }
  return new GoogleGenerativeAIEmbeddings({
    apiKey: env.GOOGLE_API_KEY,
    model: modelName,
  });
};
