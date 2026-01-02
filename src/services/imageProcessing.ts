import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { config } from '../config/index.js';

export interface ProcessedImage {
  originalPath: string;
  thumbnailPath?: string;
  width: number;
  height: number;
  size: number;
}

/**
 * Process and optimize an uploaded image
 * - Compress image
 * - Generate thumbnail
 * - Extract metadata
 */
export const processImage = async (
  filePath: string,
): Promise<ProcessedImage> => {
  try {
    const image = sharp(filePath);
    const metadata = await image.metadata();

    // Optimize original image
    await image
      .jpeg({ quality: config.upload.imageQuality, progressive: true })
      .png({ compressionLevel: 9, progressive: true })
      .webp({ quality: config.upload.imageQuality })
      .toFile(filePath + '.optimized');

    // Replace original with optimized
    await fs.unlink(filePath);
    await fs.rename(filePath + '.optimized', filePath);

    // Generate thumbnail
    const ext = path.extname(filePath);
    const thumbnailPath = filePath.replace(ext, `-thumb${ext}`);

    await sharp(filePath)
      .resize(config.upload.thumbnailWidth, config.upload.thumbnailHeight, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 70 })
      .png({ compressionLevel: 9 })
      .webp({ quality: 70 })
      .toFile(thumbnailPath);

    // Get file size after optimization
    const stats = await fs.stat(filePath);

    return {
      originalPath: filePath,
      thumbnailPath,
      width: metadata.width || 0,
      height: metadata.height || 0,
      size: stats.size,
    };
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Failed to process image');
  }
};

/**
 * Generate thumbnail only (without optimizing original)
 */
export const generateThumbnail = async (
  filePath: string,
  width?: number,
  height?: number,
): Promise<string> => {
  try {
    const ext = path.extname(filePath);
    const thumbnailPath = filePath.replace(ext, `-thumb${ext}`);

    await sharp(filePath)
      .resize(
        width || config.upload.thumbnailWidth,
        height || config.upload.thumbnailHeight,
        {
          fit: 'cover',
          position: 'center',
        },
      )
      .jpeg({ quality: 70 })
      .png({ compressionLevel: 9 })
      .webp({ quality: 70 })
      .toFile(thumbnailPath);

    return thumbnailPath;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    throw new Error('Failed to generate thumbnail');
  }
};

/**
 * Get image metadata
 */
export const getImageMetadata = async (
  filePath: string,
): Promise<{ width: number; height: number; format: string; size: number }> => {
  try {
    const image = sharp(filePath);
    const metadata = await image.metadata();
    const stats = await fs.stat(filePath);

    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: stats.size,
    };
  } catch (error) {
    console.error('Error getting image metadata:', error);
    throw new Error('Failed to get image metadata');
  }
};

/**
 * Delete image and its thumbnail
 */
export const deleteImage = async (filePath: string): Promise<void> => {
  try {
    // Delete original
    await fs.unlink(filePath);

    // Delete thumbnail if exists
    const ext = path.extname(filePath);
    const thumbnailPath = filePath.replace(ext, `-thumb${ext}`);
    try {
      await fs.unlink(thumbnailPath);
    } catch {
      // Thumbnail might not exist, ignore error
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    throw new Error('Failed to delete image');
  }
};

/**
 * Validate image file
 */
export const validateImage = async (filePath: string): Promise<boolean> => {
  try {
    const image = sharp(filePath);
    await image.metadata();
    return true;
  } catch {
    return false;
  }
};
