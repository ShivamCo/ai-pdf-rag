import { Router } from 'express';
import {
  uploadDocument,
  getUserDocuments,
  deleteDocument,
} from '../controllers/document.controller.js';
import upload from '../middlewares/upload.middleware.js';
import { requireAuthentication } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(requireAuthentication);

router.post('/upload-document', upload.single('pdf'), uploadDocument);
router.get('/user-documents', getUserDocuments);
router.delete('/documents/:id', deleteDocument);

export default router;
