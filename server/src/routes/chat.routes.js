import { Router } from 'express';
import { chat, getHistory } from '../controllers/chat.controller.js';
import { requireAuthentication } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(requireAuthentication);

router.post('/chat', chat);
router.get('/chat/history/:documentId', getHistory);

export default router;
