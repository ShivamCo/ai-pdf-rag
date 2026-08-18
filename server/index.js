import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import multer from 'multer';
import { Queue } from 'bullmq';

const app = express();

dotenv.config();

const port = process.env.PORT_DEV || 5000;
const origin_dev = process.env.ORIGIN_DEV

app.use(cors({

  origin: origin_dev
}
));

app.get('/', (req, res) => {
  res.send('Hello World!');
});



const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, `AI_PDF_RAG-${uniquePrefix}-${file.originalname}`)
  }
})

const upload = multer({ storage: storage })

const queues = new Queue("pdf-upload-queue", {connection: {
  host: 'localhost',
  port: '6379'
}})

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
