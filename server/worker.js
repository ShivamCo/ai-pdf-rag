import { Worker } from 'bullmq';
import { QdrantVectorStore } from '@langchain/qdrant';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import * as dotenv from 'dotenv';

dotenv.config();

const worker = new Worker(
  'pdf-upload-queue',

  async (job) => {
    try {
      console.log(`\n[Job ${job.id}] Processing PDF upload...`);

      // --------------------------------------------------
      // 1. Parse job data
      // --------------------------------------------------

      const rawData = job.data;

      const data =
        typeof rawData === 'string'
          ? JSON.parse(rawData)
          : rawData;

      if (!data?.path) {
        throw new Error(
          `Invalid job payload: missing file path. Data: ${JSON.stringify(
            rawData
          )}`
        );
      }

      console.log(`[Job ${job.id}] PDF path: ${data.path}`);

      // --------------------------------------------------
      // 2. Load PDF
      // --------------------------------------------------

      const loader = new PDFLoader(data.path);

      const docs = await loader.load();

      console.log(
        `[Job ${job.id}] Loaded ${docs.length} PDF page(s)`
      );

      if (!docs.length) {
        throw new Error('PDF contains no readable pages');
      }

      // --------------------------------------------------
      // 3. Remove empty pages
      // --------------------------------------------------

      const validDocs = docs.filter(
        (doc) =>
          doc.pageContent &&
          doc.pageContent.trim().length > 0
      );

      console.log(
        `[Job ${job.id}] Pages with text: ${validDocs.length}/${docs.length}`
      );

      if (!validDocs.length) {
        throw new Error(
          'PDF contains no extractable text'
        );
      }

      // --------------------------------------------------
      // 4. Split document
      // --------------------------------------------------

      const textSplitter =
        new RecursiveCharacterTextSplitter({
          chunkSize: 1000,
          chunkOverlap: 10,
        });

      const textChunks =
        await textSplitter.splitDocuments(validDocs);

      // Remove empty chunks
      const validChunks = textChunks.filter(
        (doc) =>
          doc.pageContent &&
          doc.pageContent.trim().length > 0
      );

      console.log(
        `[Job ${job.id}] Created ${validChunks.length} valid chunk(s)`
      );

      if (!validChunks.length) {
        throw new Error(
          'No valid text chunks were generated from PDF'
        );
      }

      // --------------------------------------------------
      // 5. Gemini API key
      // --------------------------------------------------

      const googleApiKey =
        process.env.GOOGLE_API_KEY;

      if (!googleApiKey) {
        throw new Error(
          'GOOGLE_API_KEY is missing from .env'
        );
      }

      // --------------------------------------------------
      // 6. Initialize Gemini embeddings
      // --------------------------------------------------

      const embeddings =
        new GoogleGenerativeAIEmbeddings({
          apiKey: googleApiKey,

          model: 'gemini-embedding-2',

          // Gemini Embedding 2 default output dimension
          // outputDimensionality: 3072,
        });

      console.log(
        `[Job ${job.id}] Gemini embeddings initialized`
      );

      // --------------------------------------------------
      // 7. Test embedding API
      // --------------------------------------------------

      const testVector =
        await embeddings.embedQuery(
          'test check'
        );

      console.log(
        `[Job ${job.id}] Test embedding length:`,
        testVector?.length
      );

      if (
        !Array.isArray(testVector) ||
        testVector.length === 0
      ) {
        throw new Error(
          'Gemini returned an empty test embedding'
        );
      }

      console.log(
        `[Job ${job.id}] Test embedding OK`
      );

      // --------------------------------------------------
      // 8. Test actual PDF chunks
      // --------------------------------------------------

      console.log(
        `[Job ${job.id}] Validating document embeddings...`
      );

      for (let i = 0; i < validChunks.length; i++) {
        const text =
          validChunks[i].pageContent.trim();

        const vector =
          await embeddings.embedQuery(text);

        console.log(
          `[Job ${job.id}] Chunk ${i}: text=${text.length} chars, vector=${vector?.length}`
        );

        if (
          !Array.isArray(vector) ||
          vector.length === 0
        ) {
          throw new Error(
            `Gemini returned an empty vector for chunk ${i}`
          );
        }
      }

      console.log(
        `[Job ${job.id}] All chunk embeddings validated`
      );

      // --------------------------------------------------
      // 9. Qdrant configuration
      // --------------------------------------------------

      const qdrantUrl =
        process.env.QDRANT_URL_LOCAL;

      const qdrantApiKey =
        process.env.QDRANT_API_KEY;

      if (!qdrantUrl) {
        throw new Error(
          'QDRANT_URL is missing from .env'
        );
      }

      console.log(
        `[Job ${job.id}] Qdrant URL: ${qdrantUrl}`
      );

      // --------------------------------------------------
      // 10. Upload to Qdrant
      // --------------------------------------------------

      console.log(
        `[Job ${job.id}] Uploading ${validChunks.length} chunks to Qdrant...`
      );

      await QdrantVectorStore.fromDocuments(
        validChunks,
        embeddings,
        {
          url: qdrantUrl,


          collectionName:
            'ai-pdf-documents',
        }
      );

      // --------------------------------------------------
      // 11. Success
      // --------------------------------------------------

      console.log(
        `[Job ${job.id}] Successfully uploaded to Qdrant!`
      );

      return {
        status: 'success',
        chunks: validChunks.length,
      };
    } catch (error) {
      console.error(
        `[Job ${job.id}] Error:`,
        error?.message || error
      );

      throw error;
    }
  },

  {
    concurrency: 10,

    connection: {
      host: 'localhost',
      port: 6379,
    },
  }
);

worker.on('completed', (job) => {
  console.log(
    `[Job ${job.id}] Completed successfully`
  );
});

worker.on('failed', (job, error) => {
  console.error(
    `[Job ${job?.id}] Failed:`,
    error.message
  );
});

console.log('PDF worker started...');