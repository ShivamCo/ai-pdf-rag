import fs from 'fs';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { env } from '../config/env.js';

let s3Client = null;

export const isR2Configured = () => {
  return (
    !!env.CLOUDFLARE_S3_ENDPOINT &&
    !!env.CLOUDFLARE_ACCESS_KEY_ID &&
    !!env.CLOUDFLARE_SECRET_ACCESS_KEY
  );
};

export const getS3Client = () => {
  if (!s3Client) {
    if (!isR2Configured()) {
      throw new Error(
        'Cloudflare R2 credentials are missing in environment variables.'
      );
    }
    s3Client = new S3Client({
      region: 'auto',
      endpoint: env.CLOUDFLARE_S3_ENDPOINT,
      credentials: {
        accessKeyId: env.CLOUDFLARE_ACCESS_KEY_ID,
        secretAccessKey: env.CLOUDFLARE_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
};

/**
 * Uploads a local file to Cloudflare R2 bucket
 */
export const uploadToR2 = async (
  filePath,
  filename,
  mimeType = 'application/pdf'
) => {
  const s3 = getS3Client();
  const fileStream = fs.createReadStream(filePath);
  const key = `pdfs/${filename}`;

  const command = new PutObjectCommand({
    Bucket: env.CLOUDFLARE_BUCKET_NAME,
    Key: key,
    Body: fileStream,
    ContentType: mimeType,
  });

  await s3.send(command);
  console.log(`[Storage Service] Uploaded file to Cloudflare R2: ${key}`);

  return {
    key,
    bucket: env.CLOUDFLARE_BUCKET_NAME,
  };
};

/**
 * Downloads a file buffer from Cloudflare R2 bucket
 */
export const downloadFromR2 = async (r2Key) => {
  const s3 = getS3Client();
  const command = new GetObjectCommand({
    Bucket: env.CLOUDFLARE_BUCKET_NAME,
    Key: r2Key,
  });

  const response = await s3.send(command);
  const byteArray = await response.Body.transformToByteArray();
  return Buffer.from(byteArray);
};

/**
 * Deletes a file from Cloudflare R2 bucket
 */
export const deleteFromR2 = async (r2Key) => {
  if (!r2Key) return;
  try {
    const s3 = getS3Client();
    const command = new DeleteObjectCommand({
      Bucket: env.CLOUDFLARE_BUCKET_NAME,
      Key: r2Key,
    });

    await s3.send(command);
    console.log(`[Storage Service] Deleted file from Cloudflare R2: ${r2Key}`);
  } catch (error) {
    console.error(
      `[Storage Service] Failed to delete file from Cloudflare R2 (${r2Key}):`,
      error.message
    );
  }
};

/**
 * Safely deletes a file from the local filesystem
 */
export const deleteLocalFile = async (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      console.log(`[Storage Service] Deleted local temp file: ${filePath}`);
    }
  } catch (error) {
    console.error(
      `[Storage Service] Failed to delete local temp file (${filePath}):`,
      error.message
    );
  }
};
