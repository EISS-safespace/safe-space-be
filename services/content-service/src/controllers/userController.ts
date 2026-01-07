import { Request, Response, NextFunction } from 'express';
import User from '../models/User.js';
import Post from '../models/Post.js';
import { AppError } from '../utils/AppError.js';
import path from 'path';
import fs from 'fs/promises';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

export const getUserProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username } = req.params;
    const currentUserId = req.user?.id;

    const user = await User.findOne({
      where: { username },
      attributes: ['id', 'username', 'displayName', 'avatarUrl', 'bio', 'coverPhotoUrl', 'email', 'isVerifiedTherapist', 'emailVerified', 'createdAt'],
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Get user's posts
    const posts = await Post.findAll({
      where: { userId: user.id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'displayName', 'avatarUrl', 'isVerifiedTherapist'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 20,
    });

    const isOwnProfile = currentUserId === user.id;

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName || user.username,
        bio: user.bio || null,
        avatarUrl: user.avatarUrl,
        coverPhotoUrl: user.coverPhotoUrl || null,
        isVerifiedTherapist: user.isVerifiedTherapist,
        createdAt: user.createdAt,
      },
      posts,
      isOwnProfile,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserPosts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const user = await User.findOne({ where: { username } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const posts = await Post.findAndCountAll({
      where: { userId: user.id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'displayName', 'avatarUrl', 'isVerifiedTherapist'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      success: true,
      posts: posts.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: posts.count,
        totalPages: Math.ceil(posts.count / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const { displayName, avatarUrl, bio, coverPhotoUrl } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Update only fields that exist in the User model
    if (displayName !== undefined) {
      user.displayName = displayName;
    }
    if (avatarUrl !== undefined) {
      user.avatarUrl = avatarUrl;
    }
    if (bio !== undefined) {
      user.bio = bio;
    }
    if (coverPhotoUrl !== undefined) {
      user.coverPhotoUrl = coverPhotoUrl;
    }

    await user.save();

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        coverPhotoUrl: user.coverPhotoUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), '../../uploads');

export const uploadAvatar = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const file = req.file;
    if (!file) {
      throw new AppError('No file uploaded', 400);
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Ensure upload directory exists
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const ext = path.extname(file.originalname);
    const filename = `avatar-${timestamp}-${randomString}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Save file to disk
    await fs.writeFile(filepath, file.buffer);

    // Generate URL path
    const avatarUrl = `/uploads/${filename}`;

    // Update user avatar URL
    user.avatarUrl = avatarUrl;
    await user.save();

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatarUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const uploadCoverPhoto = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const file = req.file;
    if (!file) {
      throw new AppError('No file uploaded', 400);
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Ensure upload directory exists
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const ext = path.extname(file.originalname);
    const filename = `cover-${timestamp}-${randomString}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Save file to disk
    await fs.writeFile(filepath, file.buffer);

    // Generate URL path
    const coverPhotoUrl = `/uploads/${filename}`;

    // Update user cover photo URL
    user.coverPhotoUrl = coverPhotoUrl;
    await user.save();

    res.json({
      success: true,
      message: 'Cover photo uploaded successfully',
      data: {
        coverPhotoUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

