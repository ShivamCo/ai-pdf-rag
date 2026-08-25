import multer from "multer";


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '../uploads/');
  },
  filename: function (req, file, cb) {
    const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `AI_PDF_RAG-${uniquePrefix}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });


export default upload;
