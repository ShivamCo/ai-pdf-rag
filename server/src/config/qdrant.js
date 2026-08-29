import { QdrantVectorStore } from '@langchain/qdrant';
import { env } from './env.js';

export const COLLECTION_NAME = 'ai-pdf-documents';

export const getVectorStoreFromExisting = async (embeddings) => {
  if (!env.QDRANT_URL) {
    throw new Error('QDRANT_URL environment variable is not defined.');
  }

  return await QdrantVectorStore.fromExistingCollection(embeddings, {
    url: env.QDRANT_URL,
    ...(env.QDRANT_API_KEY ? { apiKey: env.QDRANT_API_KEY } : {}),
    collectionName: COLLECTION_NAME,
  });
};

export const saveDocumentsToVectorStore = async (docs, embeddings) => {
  if (!env.QDRANT_URL) {
    throw new Error('QDRANT_URL environment variable is not defined.');
  }

  return await QdrantVectorStore.fromDocuments(docs, embeddings, {
    url: env.QDRANT_URL,
    ...(env.QDRANT_API_KEY ? { apiKey: env.QDRANT_API_KEY } : {}),
    collectionName: COLLECTION_NAME,
  });
};
