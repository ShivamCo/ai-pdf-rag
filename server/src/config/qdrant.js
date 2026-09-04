import { QdrantVectorStore } from '@langchain/qdrant';
import { env } from './env.js';

export const COLLECTION_NAME = 'ai-pdf-documents';

export const ensurePayloadIndices = async (client) => {
  try {
    await client.createPayloadIndex(COLLECTION_NAME, {
      field_name: 'metadata.documentId',
      field_schema: 'keyword',
    });
  } catch {}
  try {
    await client.createPayloadIndex(COLLECTION_NAME, {
      field_name: 'metadata.userId',
      field_schema: 'keyword',
    });
  } catch {}
};

export const getVectorStoreFromExisting = async (embeddings) => {
  if (!env.QDRANT_URL) {
    throw new Error('QDRANT_URL environment variable is not defined.');
  }

  const store = await QdrantVectorStore.fromExistingCollection(embeddings, {
    url: env.QDRANT_URL,
    ...(env.QDRANT_API_KEY ? { apiKey: env.QDRANT_API_KEY } : {}),
    collectionName: COLLECTION_NAME,
  });

  ensurePayloadIndices(store.client).catch(() => {});
  return store;
};

export const saveDocumentsToVectorStore = async (docs, embeddings) => {
  if (!env.QDRANT_URL) {
    throw new Error('QDRANT_URL environment variable is not defined.');
  }

  const store = await QdrantVectorStore.fromDocuments(docs, embeddings, {
    url: env.QDRANT_URL,
    ...(env.QDRANT_API_KEY ? { apiKey: env.QDRANT_API_KEY } : {}),
    collectionName: COLLECTION_NAME,
  });

  ensurePayloadIndices(store.client).catch(() => {});
  return store;
};
