import fs from 'fs';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { getGoogleEmbeddingsClient } from '../config/ai.js';
import { saveDocumentsToVectorStore } from '../config/qdrant.js';
import { downloadFromR2, deleteLocalFile } from './storage.service.js';
import { prisma } from '../config/db.js';

export const processPdfAndStore = async ({
  documentId,
  userId,
  r2Key,
  path: filePath,
}) => {
  if (!r2Key && !filePath) {
    throw new Error('Either r2Key or filePath is required for PDF processing');
  }

  let loader;
  if (filePath && fs.existsSync(filePath)) {
    loader = new PDFLoader(filePath);
  } else if (r2Key) {
    const pdfBuffer = await downloadFromR2(r2Key);
    const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
    loader = new PDFLoader(pdfBlob);
  } else if (filePath) {
    loader = new PDFLoader(filePath);
  }

  try {
    const docs = await loader.load();
    if (!docs || docs.length === 0) {
      throw new Error('PDF contains no readable pages');
    }

    const validDocs = docs.filter(
      (doc) => doc.pageContent && doc.pageContent.trim().length > 0
    );

    if (!validDocs.length) {
      throw new Error('PDF contains no extractable text');
    }

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 10,
    });
    const textChunks = await textSplitter.splitDocuments(validDocs);

    const validChunks = textChunks.filter(
      (doc) => doc.pageContent && doc.pageContent.trim().length > 0
    );

    if (!validChunks.length) {
      throw new Error('No valid text chunks generated from PDF');
    }

    if (documentId || userId) {
      validChunks.forEach((chunk) => {
        chunk.metadata = {
          ...chunk.metadata,
          ...(documentId ? { documentId } : {}),
          ...(userId ? { userId } : {}),
        };
      });
    }

    const embeddings = getGoogleEmbeddingsClient('gemini-embedding-2');
    await saveDocumentsToVectorStore(validChunks, embeddings);

    if (documentId) {
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'COMPLETED',
          pageCount: docs.length,
          chunkCount: validChunks.length,
        },
      });
    }

    return {
      success: true,
      documentId,
      totalPages: docs.length,
      processedChunks: validChunks.length,
    };
  } catch (error) {
    if (documentId) {
      await prisma.document.update({
        where: { id: documentId },
        data: { status: 'FAILED' },
      });
    }
    throw error;
  } finally {
    if (filePath) {
      await deleteLocalFile(filePath);
    }
  }
};
