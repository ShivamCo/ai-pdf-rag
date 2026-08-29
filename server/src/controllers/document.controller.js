import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { pdfUploadQueue } from '../queues/document.queue.js';
import { prisma } from '../config/db.js';
import {
  isR2Configured,
  uploadToR2,
  deleteFromR2,
  deleteLocalFile,
} from '../services/storage.service.js';

export const MAX_PDF_LIMIT = 5;

/**
 * Upload a PDF document (Enforces 5 PDF limit per user)
 */
export const uploadDocument = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized request.');
  }

  if (!req.file) {
    throw new ApiError(400, 'No PDF file uploaded.');
  }

  // 1. Enforce 5 PDF limit per user
  const userDocCount = await prisma.document.count({
    where: { userId },
  });

  if (userDocCount >= MAX_PDF_LIMIT) {
    // Delete local temp file immediately
    await deleteLocalFile(req.file.path);
    throw new ApiError(
      400,
      `Upload limit reached. You can store a maximum of ${MAX_PDF_LIMIT} PDFs. Please delete an existing PDF to upload a new one.`
    );
  }

  // 2. Create Document record in Postgres
  const document = await prisma.document.create({
    data: {
      userId,
      filename: req.file.originalname,
      originalName: req.file.originalname,
      status: 'PROCESSING',
    },
  });

  let jobPayload = {
    documentId: document.id,
    userId,
    filename: req.file.originalname,
  };

  // 3. Handle Cloudflare R2 vs Local file storage
  if (isR2Configured()) {
    console.log(
      `[Document Controller] Uploading ${req.file.originalname} to Cloudflare R2...`
    );
    const r2Result = await uploadToR2(
      req.file.path,
      req.file.filename,
      req.file.mimetype
    );

    await deleteLocalFile(req.file.path);

    jobPayload.r2Key = r2Result.key;

    // Update r2Key in DB
    await prisma.document.update({
      where: { id: document.id },
      data: { r2Key: r2Result.key },
    });
  } else {
    jobPayload.path = req.file.path;
  }

  // 4. Queue BullMQ processing job
  const job = await pdfUploadQueue.add('file-ready', jobPayload);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        document,
        jobId: job.id,
        userDocCount: userDocCount + 1,
        limit: MAX_PDF_LIMIT,
      },
      'File uploaded and queued successfully'
    )
  );
});

/**
 * Get all uploaded documents for current authenticated user
 */
export const getUserDocuments = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized request.');
  }

  const documents = await prisma.document.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { chats: true },
      },
    },
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        documents,
        count: documents.length,
        limit: MAX_PDF_LIMIT,
      },
      'User documents retrieved successfully'
    )
  );
});

/**
 * Delete a user's document
 */
export const deleteDocument = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId;
  const { id } = req.params;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized request.');
  }

  const document = await prisma.document.findFirst({
    where: { id, userId },
  });

  if (!document) {
    throw new ApiError(404, 'Document not found or access denied.');
  }

  // Delete from Cloudflare R2 if key exists
  if (document.r2Key && isR2Configured()) {
    await deleteFromR2(document.r2Key);
  }

  // Delete from Postgres (Cascade deletes chat history)
  await prisma.document.delete({
    where: { id },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Document deleted successfully'));
});
