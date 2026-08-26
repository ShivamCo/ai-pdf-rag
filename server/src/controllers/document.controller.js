import express from 'express';
import fs from 'fs';

const app = express();

import bodyParser from 'body-parser';
import { uploadDocumentToCF } from '../middlewares/s3.middleware.js';
app.use(bodyParser.json());

async function uploadDocument(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const fileStream = fs.createReadStream(req.file.path);

    const params = {
      Bucket: 'ai-pdf-bucket',
      Key: `pdfs/${req.file.filename}`,
      Body: fileStream,
      ContentType: req.file.mimetype,
    };

    uploadDocumentToCF(params);

    res.status(200).json({
      message: 'PDF uploaded successfully!',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

export default uploadDocument;
