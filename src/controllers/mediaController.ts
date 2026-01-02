import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { Post, PostMedia } from '../models/index.js';
import { MediaType } from '../models/PostMedia.js';
import { processImage } from '../services/imageProcessing.js';
import { uploadFile, deleteFile } from '../services/mediaStorage.js';

/**
 * Upload images to a post
 */
export const uploadPostImages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { postId } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      throw new AppError('No files uploaded', 400);
    }

    // Verify post exists and belongs to user
    const post = await Post.findByPk(postId);
    if (!post) {
      throw new AppError('Post not found', 404);
    }
    if (post.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    const uploadedMedia = [];

    for (const file of files) {
      // Process image (compress, generate thumbnail)
      const processed = await processImage(file.path);

      // Upload to storage (S3 or local)
      const uploadResult = await uploadFile(
        processed.originalPath,
        file.filename,
        'posts',
      );
      let thumbnailUrl: string | undefined;

      if (processed.thumbnailPath) {
        const thumbnailResult = await uploadFile(
          processed.thumbnailPath,
          file.filename.replace(/\.(jpg|jpeg|png|gif|webp)$/, '-thumb.$1'),
          'posts/thumbnails',
        );
        thumbnailUrl = thumbnailResult.url;
      }

      // Save to database
      const media = await PostMedia.create({
        postId,
        mediaType: MediaType.IMAGE,
        originalUrl: uploadResult.url,
        thumbnailUrl,
        fileName: file.filename,
        fileSize: processed.size,
        mimeType: file.mimetype,
        width: processed.width,
        height: processed.height,
      });

      uploadedMedia.push(media);
    }

    res.status(201).json({
      message: 'Images uploaded successfully',
      media: uploadedMedia,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload audio to a post
 */
export const uploadPostAudio = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { postId } = req.params;
    const file = req.file as Express.Multer.File;

    if (!file) {
      throw new AppError('No file uploaded', 400);
    }

    // Verify post exists and belongs to user
    const post = await Post.findByPk(postId);
    if (!post) {
      throw new AppError('Post not found', 404);
    }
    if (post.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    // Upload to storage
    const uploadResult = await uploadFile(
      file.path,
      file.filename,
      'posts/audio',
    );

    // Save to database
    const media = await PostMedia.create({
      postId,
      mediaType: MediaType.AUDIO,
      originalUrl: uploadResult.url,
      fileName: file.filename,
      fileSize: file.size,
      mimeType: file.mimetype,
    });

    res.status(201).json({
      message: 'Audio uploaded successfully',
      media,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get media for a post
 */
export const getPostMedia = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { postId } = req.params;

    const media = await PostMedia.findAll({
      where: { postId, deletedAt: null },
      order: [['uploadedAt', 'ASC']],
    });

    res.json({ media });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete media from a post
 */
export const deletePostMedia = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { postId, mediaId } = req.params;

    // Verify post exists and belongs to user
    const post = await Post.findByPk(postId);
    if (!post) {
      throw new AppError('Post not found', 404);
    }
    if (post.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    // Find media
    const media = await PostMedia.findOne({
      where: { id: mediaId, postId },
    });

    if (!media) {
      throw new AppError('Media not found', 404);
    }

    // Delete from storage
    await deleteFile(media.originalUrl);
    if (media.thumbnailUrl) {
      await deleteFile(media.thumbnailUrl);
    }

    // Soft delete from database
    await media.update({ deletedAt: new Date() });

    res.json({ message: 'Media deleted successfully' });
  } catch (error) {
    next(error);
  }
};
