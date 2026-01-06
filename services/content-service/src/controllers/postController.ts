import { Response, NextFunction } from 'express';
import { Post, User, Reaction, Comment } from '../models/index.js';
import { AuthRequest } from '../middleware/auth.js';
import { Op } from 'sequelize';

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Get all posts
export const getPosts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (type) {
      where.type = type;
    }

    const posts = await Post.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'displayName', 'avatarUrl', 'isVerifiedTherapist'],
        },
      ],
    });

    res.json({
      posts: posts.rows,
      total: posts.count,
      page: Number(page),
      totalPages: Math.ceil(posts.count / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
};

// Get single post
export const getPost = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const post = await Post.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'displayName', 'avatarUrl', 'isVerifiedTherapist'],
        },
        {
          model: Comment,
          as: 'comments',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'displayName', 'avatarUrl'],
            },
          ],
        },
      ],
    });

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    res.json(post);
  } catch (error) {
    next(error);
  }
};

// Create post
export const createPost = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { content, type, isAnonymous, triggerWarnings, mediaUrls } = req.body;

    const post = await Post.create({
      userId: req.user.id,
      content,
      type: type || 'text',
      isAnonymous: isAnonymous || false,
      triggerWarnings: triggerWarnings || [],
      mediaUrls: mediaUrls || [],
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
    });

    const createdPost = await Post.findByPk(post.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'displayName', 'avatarUrl'],
        },
      ],
    });

    res.status(201).json(createdPost);
  } catch (error) {
    next(error);
  }
};

// Update post
export const updatePost = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { id } = req.params;
    const { content, triggerWarnings } = req.body;

    const post = await Post.findByPk(id);

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    if (post.userId !== req.user.id) {
      throw new AppError('Forbidden', 403);
    }

    post.content = content || post.content;
    post.triggerWarnings = triggerWarnings || post.triggerWarnings;
    post.isEdited = true;
    post.editedAt = new Date();

    await post.save();

    res.json(post);
  } catch (error) {
    next(error);
  }
};

// Delete post
export const deletePost = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { id } = req.params;
    const post = await Post.findByPk(id);

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    if (post.userId !== req.user.id) {
      throw new AppError('Forbidden', 403);
    }

    await post.destroy();

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    next(error);
  }
};

