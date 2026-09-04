import {
  getGoogleEmbeddingsClient,
  getGoogleGenAIClient,
} from '../config/ai.js';
import { getVectorStoreFromExisting } from '../config/qdrant.js';
import { prisma } from '../config/db.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

const callGeminiWithFallback = async (prompt) => {
  const ai = getGoogleGenAIClient();
  const rawModel = env.GEMINI_MODEL;
  const preferredModel =
    rawModel && rawModel !== 'gemini-2.5-flash' ? rawModel : 'gemini-3.6-flash';

  const candidateModels = Array.from(
    new Set([preferredModel, 'gemini-3.6-flash'].filter(Boolean))
  );

  let lastError = null;
  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (err) {
      console.warn(
        `Gemini model ${model} failed, trying fallback:`,
        err.message || err
      );
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini models are currently unavailable');
};

export const generateRagResponse = async ({ question, documentId, userId }) => {
  if (!question || typeof question !== 'string' || !question.trim()) {
    throw new ApiError(400, 'Valid question is required');
  }

  if (documentId && userId) {
    const doc = await prisma.document.findFirst({
      where: { id: documentId, userId },
    });
    if (!doc) {
      throw new ApiError(404, 'Document not found or access denied');
    }
  }

  const embeddings = getGoogleEmbeddingsClient('gemini-embedding-2');
  const vectorStore = await getVectorStoreFromExisting(embeddings);

  let docs = [];
  if (documentId) {
    try {
      docs = await vectorStore.similaritySearch(question, 5, {
        must: [
          {
            key: 'metadata.documentId',
            match: { value: documentId },
          },
        ],
      });
    } catch (err) {
      console.warn('Filtered vector search failed, falling back:', err.message);
    }
  }

  // Fallback if no docs retrieved via filtered search
  if (!docs || docs.length === 0) {
    const retriever = await vectorStore.asRetriever({ k: 10 });
    const rawDocs = await retriever.invoke(question);
    if (documentId) {
      const filtered = rawDocs.filter(
        (d) => d.metadata && d.metadata.documentId === documentId
      );
      docs = filtered.length > 0 ? filtered : rawDocs;
    } else {
      docs = rawDocs;
    }
  }

  // Filter out empty or trivial single-character noise chunks (e.g. single dash "–")
  const validDocs = docs.filter(
    (d) => d.pageContent && d.pageContent.trim().length > 3
  );
  const contextDocs = validDocs.length > 0 ? validDocs : docs;

  const context = contextDocs.map((doc) => doc.pageContent).join('\n\n');

  const prompt = `You are a helpful and knowledgeable AI assistant that answers questions based on the provided PDF document context.

PDF Context:
${context}

Question:
${question}

Instructions:
- Answer the question accurately and thoroughly based on the provided PDF context.
- Highlight key facts, explanations, or data points mentioned in the text.
- Only say "I couldn't find this information in the provided document" if the provided text truly contains no information relevant to the question.`;

  const answerText = await callGeminiWithFallback(prompt);

  if (documentId && userId) {
    try {
      await prisma.chatMessage.createMany({
        data: [
          {
            documentId,
            userId,
            role: 'user',
            content: question.trim(),
          },
          {
            documentId,
            userId,
            role: 'assistant',
            content: answerText,
            sources: docs ? JSON.parse(JSON.stringify(docs)) : [],
          },
        ],
      });
    } catch (err) {
      console.error('Failed to save chat history:', err.message);
    }
  }

  return {
    message: answerText,
    docs,
  };
};

export const getChatHistory = async (documentId, userId) => {
  if (!documentId || !userId) {
    throw new Error('documentId and userId are required');
  }

  const doc = await prisma.document.findFirst({
    where: { id: documentId, userId },
  });

  if (!doc) {
    throw new Error('Document not found');
  }

  return await prisma.chatMessage.findMany({
    where: { documentId, userId },
    orderBy: { createdAt: 'asc' },
  });
};
