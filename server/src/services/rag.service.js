import {
  getGoogleEmbeddingsClient,
  getGoogleGenAIClient,
} from '../config/ai.js';
import { getVectorStoreFromExisting } from '../config/qdrant.js';
import { prisma } from '../config/db.js';

export const generateRagResponse = async ({ question, documentId, userId }) => {
  if (!question || typeof question !== 'string' || !question.trim()) {
    throw new Error('Valid question is required');
  }

  if (documentId && userId) {
    const doc = await prisma.document.findFirst({
      where: { id: documentId, userId },
    });
    if (!doc) {
      throw new Error('Document not found or access denied');
    }
  }

  const embeddings = getGoogleEmbeddingsClient('gemini-embedding-2');
  const vectorStore = await getVectorStoreFromExisting(embeddings);

  const retriever = await vectorStore.asRetriever({ k: 3 });
  let docs = await retriever.invoke(question);

  if (documentId) {
    const filtered = docs.filter(
      (d) =>
        d.metadata &&
        (d.metadata.documentId === documentId || !d.metadata.documentId)
    );
    if (filtered.length > 0) {
      docs = filtered;
    }
  }

  const context = docs.map((doc) => doc.pageContent).join('\n\n');

  const prompt = `You are a helpful AI assistant that answers questions based strictly on the provided PDF context.

Rules:
- Use only the provided context as factual source.
- Be concise, accurate, and direct.
- If the answer is not in the text, say: "I couldn't find this information in the provided document."

Context:
${context}

Question:
${question}`;

  const ai = getGoogleGenAIClient();
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
  });

  const answerText = response.text || '';

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

