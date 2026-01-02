import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { config } from '../config/index.js';
import { AppError } from './errorHandler.js';
import fs from 'fs';

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), config.upload.uploadDir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    // Generate unique filename: timestamp-randomstring-originalname
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
  },
});

// File filter for images
const imageFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void => {
  if (config.upload.allowedImageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `Invalid file type. Allowed types: ${config.upload.allowedImageTypes.join(', ')}`,
        400,
      ),
    );
  }
};

// File filter for audio
const audioFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void => {
  if (config.upload.allowedAudioTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `Invalid file type. Allowed types: ${config.upload.allowedAudioTypes.join(', ')}`,
        400,
      ),
    );
  }
};

// File filter for both images and audio
const mediaFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void => {
  const allowedTypes = [
    ...config.upload.allowedImageTypes,
    ...config.upload.allowedAudioTypes,
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
        400,
      ),
    );
  }
};

// Image upload middleware
export const uploadImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: config.upload.maxImageSize,
  },
});

// Audio upload middleware
export const uploadAudio = multer({
  storage,
  fileFilter: audioFileFilter,
  limits: {
    fileSize: config.upload.maxAudioSize,
  },
});

// General media upload middleware
export const uploadMedia = multer({
  storage,
  fileFilter: mediaFileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
});

// Multiple images upload (for posts)
export const uploadImages = uploadImage.array(
  'images',
  config.upload.maxImagesPerPost,
);

// Single image upload
export const uploadSingleImage = uploadImage.single('image');

// Single audio upload
export const uploadSingleAudio = uploadAudio.single('audio');

// Mixed media upload (images + audio)
export const uploadMixedMedia = uploadMedia.fields([
  { name: 'images', maxCount: config.upload.maxImagesPerPost },
  { name: 'audio', maxCount: 1 },
]);
