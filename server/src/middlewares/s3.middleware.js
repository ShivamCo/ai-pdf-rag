import multer from 'multer';
import { env } from '../config/env.js';

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: 'auto', // Required by AWS SDK, not used by R2
  // Provide your R2 endpoint: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
  endpoint: env.CLOUDFLARE_S3_ENDPOINT,
  credentials: {
    // Provide your R2 Access Key ID and Secret Access Key
    accessKeyId: env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_SECRET_ACCESS_KEY,
  },
});

// Upload a file

export async function uploadDocumentToCF(param) {

  
  await s3.send(
    new PutObjectCommand(param)
  );
  console.log('Uploaded myfile.txt');
}

// // Download a file
// const response = await s3.send(
// 	new GetObjectCommand({
// 		Bucket: "my-bucket",
// 		Key: "myfile.txt",
// 	}),
// );
// const content = await response.Body.transformToString();
// console.log("Downloaded:", content);

// // List objects
// const list = await s3.send(
// 	new ListObjectsV2Command({
// 		Bucket: "my-bucket",
// 	}),
// );
// console.log(
// 	"Objects:",
// 	list.Contents.map((obj) => obj.Key),
// );
