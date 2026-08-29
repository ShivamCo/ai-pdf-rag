/**
 * Cloudflare R2 / S3 Storage Utilities
 * Note: Core storage logic is maintained in `src/services/storage.service.js`
 */
export {
  uploadToR2,
  downloadFromR2,
  deleteFromR2,
  deleteLocalFile,
  isR2Configured,
  getS3Client,
} from '../services/storage.service.js';
