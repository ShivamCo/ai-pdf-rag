import { Worker } from 'bullmq';
import { QdrantVectorStore } from '@langchain/qdrant';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { CharacterTextSplitter } from '@langchain/textsplitters';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { TaskType } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config();

const worker = new Worker(
  'pdf-upload-queue',
  async (job) => {
    try {
      console.log(`[Job ${job.id}] Processing PDF upload...`);

      // 1. Parse job data safely
      const rawData = job.data;
      const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

      if (!data || !data.path) {
        throw new Error(`Invalid job payload: missing file path (${JSON.stringify(rawData)})`);
      }

      console.log(`[Job ${job.id}] Loading PDF from: ${data.path}`);

      // 2. Load PDF document
      const loader = new PDFLoader(data.path);
      const docs = await loader.load();

      // 3. Split into text chunks
      const textSplitter = new CharacterTextSplitter({
        chunkSize: 300,
        chunkOverlap: 0,
      });

      const textChunks = await textSplitter.splitDocuments(docs);
      console.log(`[Job ${job.id}] Split document into ${textChunks.length} chunk(s)`);

      // 4. Initialize Google Gemini Embeddings
      const googleApiKey = process.env.GOOGLE_API_KEY;
      if (!googleApiKey) {
        throw new Error('GOOGLE_API_KEY is missing in server/.env');
      }

      const embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: googleApiKey,
        model: 'gemini-embedding-2'

      });

      // 5. Validate Gemini embedding API key & response
      const testVector = await embeddings.embedQuery('test check');
      if (!testVector || testVector.length === 0) {
        throw new Error(
          `Invalid GOOGLE_API_KEY in server/.env. Gemini API failed to generate embeddings. Please replace GOOGLE_API_KEY with a valid key starting with 'AIzaSy' from https://aistudio.google.com/`
        );
      }

      // 6. Upload embeddings to Qdrant
      const qdrantUrl = process.env.QDRANT_URL;
      const qdrantApiKey = process.env.QDRANT_API_KEY;

      console.log(`[Job ${job.id}] Uploading to Qdrant at ${qdrantUrl}...`);

      await QdrantVectorStore.fromDocuments(textChunks, embeddings, {
        url: qdrantUrl,
        ...(qdrantApiKey ? { apiKey: qdrantApiKey } : {}),
        collectionName: 'ai-pdf-documents',
      });

      console.log(`[Job ${job.id}] Successfully uploaded to Qdrant DB!`);
      return { status: 'success', chunks: textChunks.length };
    } catch (error) {
      console.error(`[Job ${job.id}] Error:`, error.message);
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
