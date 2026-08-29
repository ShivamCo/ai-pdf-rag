import {
  getGoogleEmbeddingsClient,
  getGoogleGenAIClient,
} from '../config/ai.js';
import { getVectorStoreFromExisting } from '../config/qdrant.js';
import { prisma } from '../config/db.js';

export const generateRagResponse = async ({ question, documentId, userId }) => {
  if (!question || typeof question !== 'string' || !question.trim()) {
    throw new Error('A valid question string is required.');
  }

  // Verify Document Ownership if documentId is passed
  let targetDocument = null;
  if (documentId && userId) {
    targetDocument = await prisma.document.findFirst({
      where: { id: documentId, userId },
    });
    if (!targetDocument) {
      throw new Error('Document not found or access denied.');
    }
  }

  // 1. Initialize Embeddings and Vector Store
  const embeddings = getGoogleEmbeddingsClient('gemini-embedding-2');
  const vectorStore = await getVectorStoreFromExisting(embeddings);

  const retriever = await vectorStore.asRetriever({ k: 3 });
  let docs = await retriever.invoke(question);

  // Filter docs by documentId or userId if metadata is present
  if (documentId) {
    const docFiltered = docs.filter(
      (d) =>
        d.metadata &&
        (d.metadata.documentId === documentId || !d.metadata.documentId)
    );
    if (docFiltered.length > 0) {
      docs = docFiltered;
    }
  }

  // 2. Format Context
  const context = docs.map((doc) => doc.pageContent).join('\n\n');

  // 3. Construct System & User Prompt
  const prompt = `
You are a helpful AI assistant that answers the user's questions based strictly on the provided PDF context.

Instructions:
- Use the provided PDF context as your primary and only source of factual information.
- Answer accurately, clearly, and concisely.
- Do not invent, assume, or hallucinate information that is not present in the PDF context.
- If the answer cannot be found in the provided context, say:
  "I couldn't find this information in the provided document."
- Do not use outside knowledge unless explicitly requested by the user.
- Maintain a professional, helpful, and easy-to-understand tone.

PDF CONTEXT:
${JSON.stringify(context)}

USER QUESTION:
${question}
`;

  // 4. Generate Answer via Gemini LLM
  const ai = getGoogleGenAIClient();
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
  });

  const answerText = response.text;

  // 5. Persist Chat History in Postgres
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
    } catch (dbErr) {
      console.error(
        '[RAG Service] Error saving chat history to Postgres:',
        dbErr.message
      );
    }
  }

  return {
    message: answerText,
    docs: docs,
  };
};

/**
 * Fetch persistent chat history for a specific document & user
 */
export const getChatHistory = async (documentId, userId) => {
  if (!documentId || !userId) {
    throw new Error(
      'documentId and userId are required to fetch chat history.'
    );
  }

  // Verify ownership
  const document = await prisma.document.findFirst({
    where: { id: documentId, userId },
  });

  if (!document) {
    throw new Error('Document not found or access denied.');
  }

  const history = await prisma.chatMessage.findMany({
    where: { documentId, userId },
    orderBy: { createdAt: 'asc' },
  });

  return history;
};
