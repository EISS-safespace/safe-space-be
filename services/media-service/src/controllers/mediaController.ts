import { Response, NextFunction } from 'express';
import { PostMedia } from '../models/index.js';
import { AuthRequest } from '../middleware/auth.js';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { config } from '../config/index.js';

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Upload single image
export const uploadImage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const file = req.file;
    const filePath = file.path;

    // Process image with sharp
    const processedFileName = `processed-${file.filename}`;
    const processedPath = path.join(config.upload.dir, processedFileName);

    await sharp(filePath)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(processedPath);

    // Create thumbnail
    const thumbnailFileName = `thumb-${file.filename}`;
    const thumbnailPath = path.join(config.upload.dir, thumbnailFileName);

    await sharp(filePath)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);

    // Get file stats
    const stats = await fs.stat(processedPath);

    // Save to database
    const media = await PostMedia.create({
      postId: req.body.postId || null,
      url: `/uploads/${processedFileName}`,
      thumbnailUrl: `/uploads/${thumbnailFileName}`,
      type: 'image',
      size: stats.size,
      mimeType: 'image/jpeg',
      uploadedBy: req.user.id,
    });

    // Delete original file
    await fs.unlink(filePath);

    res.status(201).json({
      id: media.id,
      url: media.url,
      thumbnailUrl: media.thumbnailUrl,
      type: media.type,
      size: media.size,
    });
  } catch (error) {
    next(error);
  }
};

// Upload multiple images
export const uploadImages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      throw new AppError('No files uploaded', 400);
    }

    const uploadedMedia = [];

    for (const file of req.files) {
      const filePath = file.path;

      // Process image
      const processedFileName = `processed-${file.filename}`;
      const processedPath = path.join(config.upload.dir, processedFileName);

      await sharp(filePath)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toFile(processedPath);

      // Create thumbnail
      const thumbnailFileName = `thumb-${file.filename}`;
      const thumbnailPath = path.join(config.upload.dir, thumbnailFileName);

      await sharp(filePath)
        .resize(300, 300, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

      const stats = await fs.stat(processedPath);

      const media = await PostMedia.create({
        postId: req.body.postId || null,
        url: `/uploads/${processedFileName}`,
        thumbnailUrl: `/uploads/${thumbnailFileName}`,
        type: 'image',
        size: stats.size,
        mimeType: 'image/jpeg',
        uploadedBy: req.user.id,
      });

      uploadedMedia.push({
        id: media.id,
        url: media.url,
        thumbnailUrl: media.thumbnailUrl,
        type: media.type,
        size: media.size,
      });

      // Delete original
      await fs.unlink(filePath);
    }

    res.status(201).json({ media: uploadedMedia });
  } catch (error) {
    next(error);
  }
};

// Get media by ID
export const getMedia = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    const media = await PostMedia.findByPk(id);

    if (!media) {
      throw new AppError('Media not found', 404);
    }

    res.json(media);
  } catch (error) {
    next(error);
  }
};

// Delete media
export const deleteMedia = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { id } = req.params;
    const media = await PostMedia.findByPk(id);

    if (!media) {
      throw new AppError('Media not found', 404);
    }

    if (media.uploadedBy !== req.user.id) {
      throw new AppError('Forbidden', 403);
    }

    // Delete files
    const filePath = path.join(config.upload.dir, path.basename(media.url));
    const thumbnailPath = path.join(config.upload.dir, path.basename(media.thumbnailUrl || ''));

    try {
      await fs.unlink(filePath);
      if (media.thumbnailUrl) {
        await fs.unlink(thumbnailPath);
      }
    } catch (err) {
      console.error('Error deleting files:', err);
    }

    await media.destroy();

    res.json({ message: 'Media deleted successfully' });
  } catch (error) {
    next(error);
  }
};

