import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import multer from 'multer';
import { Queue } from 'bullmq';
import { QdrantVectorStore } from '@langchain/qdrant';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { GoogleGenAI } from '@google/genai';

dotenv.config();
const app = express();

const port = process.env.PORT_DEV || 5000;
const origin_dev = process.env.ORIGIN_DEV;
const GEMINI_API_KEY = process.env.GOOGLE_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

app.use(
  cors({
    origin: origin_dev,
  })
);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `AI_PDF_RAG-${uniquePrefix}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

const queues = new Queue('pdf-upload-queue', {
  connection: {
    host: 'localhost',
    port: '6379',
  },
});

app.get('/chat', async (req, res) => {
  const googleApiKey = process.env.GOOGLE_API_KEY;
  const qdrantUrl = process.env.QDRANT_URL;
  const qdrantApiKey = process.env.QDRANT_API_KEY;

  const user_query = 'how youtube help education';

  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: googleApiKey,

    model: 'gemini-embedding-2',

    // Gemini Embedding 2 default output dimension
    outputDimensionality: 3072,
  });
  const vectorStore = await QdrantVectorStore.fromExistingCollection(
    embeddings,
    {
      url: qdrantUrl,

      ...(qdrantApiKey ? { apiKey: qdrantApiKey } : {}),

      collectionName: 'ai-pdf-documents',
    }
  );

  const retriever = await vectorStore.asRetriever({
    k: 2,
  });

  const result = await retriever.invoke(user_query);

  

  const context = result.map((doc) => doc.pageContent).join('\n\n');

  const SYSTEM_PROMPT = `
You are a helpful AI assistant that answers the user's questions based strictly on the provided PDF context.

Instructions:
- Use the provided PDF context as your primary and only source of factual information.
- Answer accurately, clearly, and concisely.
- Do not invent, assume, or hallucinate information that is not present in the PDF context.
- If the answer cannot be found in the provided context, say:
  "I couldn't find this information in the provided document."
- Do not use outside knowledge unless explicitly requested by the user.
- If the context contains conflicting information, mention the conflict rather than choosing an answer without explanation.
- When appropriate, explain your answer using relevant information from the PDF.
- Maintain a professional, helpful, and easy-to-understand tone.

PDF CONTEXT:
${JSON.stringify(context)}
`;

  async function main() {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: SYSTEM_PROMPT,
    });

    console.log({message: response.text, docs: result })

    
    
    return res.json( {message: response.text, docs: result });
  }

  main();

  

  
});

app.post('/upload/pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }
    await queues.add('file-ready', {
      filename: req.file.originalname,
      destination: req.file.destination,
      path: req.file.path,
    });
    return res.status(200).json({
      message: 'File queued successfully',
      filename: req.file.originalname,
    });
  } catch (error) {
    console.error('Error queuing file upload:', error);
    return res.status(500).json({ error: 'Failed to queue file upload' });
  }
});

app.listen(port, () => {
  console.log(`Server is Live on ${port}`);
});
