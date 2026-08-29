import { Router } from 'express';
import documentRoutes from './document.routes.js';
import chatRoutes from './chat.routes.js';

const router = Router();

router.use('/', documentRoutes);
router.use('/', chatRoutes);

export default router;
