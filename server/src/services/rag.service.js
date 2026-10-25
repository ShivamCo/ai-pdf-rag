import Anthropic from '@anthropic-ai/sdk';
import { getGoogleEmbeddingsClient, getAnthropicClient } from '../config/ai.js';
import { getVectorStoreFromExisting } from '../config/qdrant.js';
import { prisma } from '../config/db.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

const SYSTEM_PROMPT = `You are a helpful and knowledgeable assistant. Answer the user's question using only the information in the PDF excerpts provided inside <context> tags.

Guidelines:
- Give a direct answer first, then any useful explanation or supporting details.
- Use simple, clear language and short paragraphs. Use plain hyphen bullet points when they help readability.
- Include important facts, figures, dates, names or data from the excerpts when relevant.
- Keep the response concise unless the question needs a detailed explanation.
- Write plain text: no Markdown bold, no headings, no decorative symbols. The answer is displayed as plain text.
- Do not add information that the excerpts do not support.
- If the excerpts only partly answer the question, answer with what is available and say what is missing.
- Only reply "I couldn't find this information in the provided document." when the excerpts contain nothing relevant to the question.`;

const generateAnswer = async (context, question) => {
  const client = getAnthropicClient();

  let response;
  try {
    response = await client.messages.create({
      model: env.CLAUDE_MODEL,
      max_tokens: 16000,
      output_config: { effort: 'low' },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `<context>\n${context}\n</context>\n\n<question>\n${question}\n</question>`,
        },
      ],
    });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      throw new ApiError(
        429,
        'The assistant is busy right now. Please try again in a moment.'
      );
    }
    if (err instanceof Anthropic.AuthenticationError) {
      console.error('Claude authentication failed - check ANTHROPIC_API_KEY');
    }
    throw err;
  }

  if (response.stop_reason === 'refusal') {
    return "I can't help with that request.";
  }

  const answer = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim();

  if (!answer) {
    throw new Error(
      `Claude returned no text (stop_reason: ${response.stop_reason})`
    );
  }

  return answer;
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

  const answerText = await generateAnswer(context, question.trim());

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
