import { Response, NextFunction } from 'express';
import { PostMedia, MediaType } from '../models/index.js';
import { AuthRequest } from '../middleware/auth.js';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { config } from '../config/index.js';
import axios from 'axios';
import { AppError } from '../utils/AppError.js';

const CONTENT_SERVICE_URL = process.env.CONTENT_SERVICE_URL || 'http://localhost:3004';

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
      mediaType: MediaType.IMAGE,
      originalUrl: `/uploads/${processedFileName}`,
      thumbnailUrl: `/uploads/${thumbnailFileName}`,
      fileName: processedFileName,
      fileSize: stats.size,
      mimeType: 'image/jpeg',
    });

    // Delete original file
    await fs.unlink(filePath);

    res.status(201).json({
      id: media.id,
      url: media.originalUrl,
      thumbnailUrl: media.thumbnailUrl,
      type: media.mediaType,
      size: media.fileSize,
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
        mediaType: MediaType.IMAGE,
        originalUrl: `/uploads/${processedFileName}`,
        thumbnailUrl: `/uploads/${thumbnailFileName}`,
        fileName: processedFileName,
        fileSize: stats.size,
        mimeType: 'image/jpeg',
      });

      uploadedMedia.push({
        id: media.id,
        url: media.originalUrl,
        thumbnailUrl: media.thumbnailUrl,
        type: media.mediaType,
        size: media.fileSize,
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

    // Note: We don't have uploadedBy field, so we skip ownership check for now
    // In production, you should add uploadedBy field to PostMedia model

    // Delete files
    const filePath = path.join(config.upload.dir, path.basename(media.originalUrl));
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

// Upload images for a post
export const uploadPostImages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { postId } = req.params;

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      throw new AppError('No files uploaded', 400);
    }

    const uploadedMedia = [];

    for (const file of req.files) {
      const filePath = file.path;

      // Process image
      const processedFileName = `post-${postId}-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const processedPath = path.join(config.upload.dir, processedFileName);

      await sharp(filePath)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toFile(processedPath);

      // Create thumbnail
      const thumbnailFileName = `thumb-${processedFileName}`;
      const thumbnailPath = path.join(config.upload.dir, thumbnailFileName);

      await sharp(filePath)
        .resize(300, 300, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

      const stats = await fs.stat(processedPath);

      const media = await PostMedia.create({
        postId,
        mediaType: MediaType.IMAGE,
        originalUrl: `/uploads/${processedFileName}`,
        thumbnailUrl: `/uploads/${thumbnailFileName}`,
        fileName: processedFileName,
        fileSize: stats.size,
        mimeType: 'image/jpeg',
      });

      uploadedMedia.push({
        id: media.id,
        url: media.originalUrl,
        thumbnailUrl: media.thumbnailUrl,
        mediaType: media.mediaType,
        fileSize: media.fileSize,
      });

      // Delete original
      await fs.unlink(filePath);
    }

    // Update post with image URLs
    const imageUrls = uploadedMedia.map(m => m.url);
    try {
      await axios.patch(
        `${CONTENT_SERVICE_URL}/posts/${postId}/media`,
        { imageUrls },
        { headers: { Authorization: req.headers.authorization || '' } }
      );
    } catch (error) {
      console.error('Failed to update post with image URLs:', error);
      // Don't fail the request if updating post fails
    }

    res.status(201).json({
      success: true,
      media: uploadedMedia
    });
  } catch (error) {
    next(error);
  }
};

// Upload audio for a post
export const uploadPostAudio = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { postId } = req.params;

    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const file = req.file;
    const audioFileName = `audio-${postId}-${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
    const audioPath = path.join(config.upload.dir, audioFileName);

    // Move the file to the uploads directory
    await fs.rename(file.path, audioPath);

    const stats = await fs.stat(audioPath);

    const media = await PostMedia.create({
      postId,
      mediaType: MediaType.AUDIO,
      originalUrl: `/uploads/${audioFileName}`,
      fileName: audioFileName,
      fileSize: stats.size,
      mimeType: file.mimetype,
    });

    // Update post with audio URL
    try {
      await axios.patch(
        `${CONTENT_SERVICE_URL}/posts/${postId}/media`,
        { audioUrl: media.originalUrl },
        { headers: { Authorization: req.headers.authorization || '' } }
      );
    } catch (error) {
      console.error('Failed to update post with audio URL:', error);
      // Don't fail the request if updating post fails
    }

    res.status(201).json({
      success: true,
      media: {
        id: media.id,
        url: media.originalUrl,
        mediaType: media.mediaType,
        fileSize: media.fileSize,
      },
    });
  } catch (error) {
    next(error);
  }
};

