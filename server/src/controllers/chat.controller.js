import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import {
  generateRagResponse,
  getChatHistory,
} from '../services/rag.service.js';

export const chat = asyncHandler(async (req, res) => {
  const { question, documentId } = req.body;
  const userId = req.auth?.userId;

  if (!question || typeof question !== 'string' || !question.trim()) {
    throw new ApiError(400, 'Question is required');
  }

  const result = await generateRagResponse({
    question: question.trim(),
    documentId,
    userId,
  });

  return res.status(200).json({
    success: true,
    message: result.message,
    docs: result.docs,
  });
});

export const getHistory = asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  const userId = req.auth?.userId;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  if (!documentId) {
    throw new ApiError(400, 'documentId is required');
  }

  const history = await getChatHistory(documentId, userId);

  return res
    .status(200)
    .json(new ApiResponse(200, { history }, 'Chat history retrieved'));
});
