import { Router } from 'express'

import uploadDocument from '../controllers/document.controller.js'
import upload from '../middlewares/upload.middleware.js'


const router = Router()

router.route("/upload-document").post(upload.single('pdf') ,uploadDocument)

export default router