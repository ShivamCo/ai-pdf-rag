import { GoogleGenAI } from '@google/genai';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { env } from './env.js';

export const getGoogleGenAIClient = () => {
  if (!env.GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY environment variable is not defined.');
  }
  return new GoogleGenAI({ apiKey: env.GOOGLE_API_KEY });
};

export const getGoogleEmbeddingsClient = (modelName = 'gemini-embedding-2') => {
  if (!env.GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY environment variable is not defined.');
  }
  return new GoogleGenerativeAIEmbeddings({
    apiKey: env.GOOGLE_API_KEY,
    model: modelName,
  });
};
