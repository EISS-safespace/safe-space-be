import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config/index.js';
import mime from 'mime-types';

// Initialize S3 client (only if AWS credentials are provided)
let s3Client: S3Client | null = null;
if (config.aws.accessKeyId && config.aws.secretAccessKey) {
  s3Client = new S3Client({
    region: config.aws.region,
    credentials: {
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
    },
  });
}

export interface UploadResult {
  url: string;
  key?: string; // S3 key if uploaded to S3
  localPath?: string; // Local path if stored locally
}

/**
 * Upload file to S3 or local storage
 */
export const uploadFile = async (
  filePath: string,
  fileName: string,
  folder: string = 'media',
): Promise<UploadResult> => {
  // If S3 is configured, upload to S3
  if (s3Client && config.aws.s3Bucket) {
    return uploadToS3(filePath, fileName, folder);
  }

  // Otherwise, file is already in local storage
  return {
    url: `/uploads/${path.basename(filePath)}`,
    localPath: filePath,
  };
};

/**
 * Upload file to S3
 */
const uploadToS3 = async (
  filePath: string,
  fileName: string,
  folder: string,
): Promise<UploadResult> => {
  if (!s3Client) {
    throw new Error('S3 client not initialized');
  }

  try {
    const fileContent = await fs.readFile(filePath);
    const key = `${folder}/${Date.now()}-${fileName}`;
    const mimeType = mime.lookup(filePath) || 'application/octet-stream';

    const command = new PutObjectCommand({
      Bucket: config.aws.s3Bucket,
      Key: key,
      Body: fileContent,
      ContentType: mimeType,
      ACL: 'public-read',
    });

    await s3Client.send(command);

    // Construct URL (use CloudFront if configured, otherwise S3 direct URL)
    const url = config.aws.cloudFrontUrl
      ? `${config.aws.cloudFrontUrl}/${key}`
      : `https://${config.aws.s3Bucket}.s3.${config.aws.region}.amazonaws.com/${key}`;

    // Delete local file after successful upload
    await fs.unlink(filePath);

    return {
      url,
      key,
    };
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload file to S3');
  }
};

/**
 * Delete file from S3 or local storage
 */
export const deleteFile = async (
  fileUrl: string,
  s3Key?: string,
): Promise<void> => {
  // If S3 key is provided, delete from S3
  if (s3Key && s3Client && config.aws.s3Bucket) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: config.aws.s3Bucket,
        Key: s3Key,
      });
      await s3Client.send(command);
    } catch (error) {
      console.error('Error deleting from S3:', error);
      throw new Error('Failed to delete file from S3');
    }
  } else {
    // Delete from local storage
    try {
      // Extract local path from URL
      const fileName = path.basename(fileUrl);
      const filePath = path.join(
        process.cwd(),
        config.upload.uploadDir,
        fileName,
      );
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting local file:', error);
      // Don't throw error if file doesn't exist
    }
  }
};

/**
 * Get file URL (handles both S3 and local storage)
 */
export const getFileUrl = (fileName: string, s3Key?: string): string => {
  if (s3Key && config.aws.cloudFrontUrl) {
    return `${config.aws.cloudFrontUrl}/${s3Key}`;
  } else if (s3Key && config.aws.s3Bucket) {
    return `https://${config.aws.s3Bucket}.s3.${config.aws.region}.amazonaws.com/${s3Key}`;
  } else {
    return `/uploads/${fileName}`;
  }
};

/**
 * Check if S3 is configured
 */
export const isS3Configured = (): boolean => {
  return !!(s3Client && config.aws.s3Bucket);
};
