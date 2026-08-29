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
    throw new Error('Either r2Key or filePath is required for PDF processing.');
  }

  let loader;

  if (r2Key) {
    console.log(`[PDF Service] Fetching PDF from Cloudflare R2: ${r2Key}`);
    const pdfBuffer = await downloadFromR2(r2Key);
    const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
    loader = new PDFLoader(pdfBlob);
  } else {
    console.log(`[PDF Service] Loading PDF from local path: ${filePath}`);
    loader = new PDFLoader(filePath);
  }

  try {
    // 1. Load PDF
    const docs = await loader.load();

    if (!docs || docs.length === 0) {
      throw new Error('PDF contains no readable pages.');
    }

    console.log(
      `[PDF Service] Loaded ${docs.length} page(s). Filtering text content...`
    );

    // 2. Filter out pages without text
    const validDocs = docs.filter(
      (doc) => doc.pageContent && doc.pageContent.trim().length > 0
    );

    if (!validDocs.length) {
      throw new Error('PDF contains no extractable text.');
    }

    // 3. Split document into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 10,
    });
    const textChunks = await textSplitter.splitDocuments(validDocs);

    const validChunks = textChunks.filter(
      (doc) => doc.pageContent && doc.pageContent.trim().length > 0
    );

    if (!validChunks.length) {
      throw new Error('No valid text chunks were generated from PDF.');
    }

    // Tag chunks with metadata for user isolation & document mapping
    if (documentId || userId) {
      validChunks.forEach((chunk) => {
        chunk.metadata = {
          ...chunk.metadata,
          ...(documentId ? { documentId } : {}),
          ...(userId ? { userId } : {}),
        };
      });
    }

    console.log(
      `[PDF Service] Created ${validChunks.length} text chunk(s). Initializing embeddings...`
    );

    // 4. Generate embeddings and upload to Qdrant
    const embeddings = getGoogleEmbeddingsClient('gemini-embedding-2');
    console.log(
      `[PDF Service] Uploading ${validChunks.length} chunk(s) to Qdrant vector store...`
    );
    await saveDocumentsToVectorStore(validChunks, embeddings);

    // 5. Update Postgres Document Status
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

    console.log(
      `[PDF Service] Successfully processed and stored PDF vector embeddings!`
    );

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
    // Clean up local temp file if local path was used
    if (filePath) {
      await deleteLocalFile(filePath);
    }
  }
};
