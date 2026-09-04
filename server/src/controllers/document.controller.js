import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { dispatchPdfProcessing } from '../queues/document.queue.js';
import { prisma } from '../config/db.js';
import {
  isR2Configured,
  uploadToR2,
  deleteFromR2,
  deleteLocalFile,
} from '../services/storage.service.js';

export const MAX_PDF_LIMIT = 5;

export const uploadDocument = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId;
  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  if (!req.file) {
    throw new ApiError(400, 'No PDF file uploaded');
  }

  const userDocCount = await prisma.document.count({
    where: { userId },
  });

  if (userDocCount >= MAX_PDF_LIMIT) {
    await deleteLocalFile(req.file.path);
    throw new ApiError(
      400,
      `Upload limit reached. You can upload up to ${MAX_PDF_LIMIT} PDFs. Please delete an existing one to upload more.`
    );
  }

  const document = await prisma.document.create({
    data: {
      userId,
      filename: req.file.originalname,
      originalName: req.file.originalname,
      status: 'PROCESSING',
    },
  });

  const jobPayload = {
    documentId: document.id,
    userId,
    filename: req.file.originalname,
  };

  if (isR2Configured()) {
    const r2Result = await uploadToR2(
      req.file.path,
      req.file.filename,
      req.file.mimetype
    );
    await deleteLocalFile(req.file.path);
    jobPayload.r2Key = r2Result.key;

    await prisma.document.update({
      where: { id: document.id },
      data: { r2Key: r2Result.key },
    });
  } else {
    jobPayload.path = req.file.path;
  }

  const job = await dispatchPdfProcessing(jobPayload);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        document,
        jobId: job.id,
        userDocCount: userDocCount + 1,
        limit: MAX_PDF_LIMIT,
      },
      'File uploaded successfully'
    )
  );
});

export const getUserDocuments = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId;
  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
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
      'Documents retrieved'
    )
  );
});

export const deleteDocument = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId;
  const { id } = req.params;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const document = await prisma.document.findFirst({
    where: { id, userId },
  });

  if (!document) {
    throw new ApiError(404, 'Document not found');
  }

  if (document.r2Key && isR2Configured()) {
    await deleteFromR2(document.r2Key);
  }

  await prisma.document.delete({
    where: { id },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Document deleted successfully'));
});

