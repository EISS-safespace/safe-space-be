import { Request, Response, NextFunction } from 'express';
import { Post, User, Comment, Reaction } from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { getAnonymousDisplayName } from '../utils/anonymousAvatar.js';

export const createPost = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId!;
    const { content, isAnonymous, postType, triggerWarnings, mood, imageUrls, audioUrl } = req.body;

    const post = await Post.create({
      userId,
      content,
      isAnonymous: isAnonymous || false,
      postType,
      triggerWarnings: triggerWarnings || [],
      mood,
      imageUrls: imageUrls || [],
      audioUrl,
    });

    res.status(201).json({
      message: 'Post created successfully',
      post,
    });
  } catch (error) {
    next(error);
  }
};

export const getPosts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { mood, postType, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (mood) where.mood = mood;
    if (postType) where.postType = postType;

    const posts = await Post.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'displayName', 'avatarUrl', 'isVerifiedTherapist'],
        },
        {
          model: Reaction,
          as: 'reactions',
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    // Transform posts to hide user info for anonymous posts
    const transformedPosts = posts.rows.map((post) => {
      const postData = post.toJSON() as any;
      if (postData.isAnonymous) {
        postData.user = {
          displayName: getAnonymousDisplayName(post.id),
          isAnonymous: true,
        };
      }
      return postData;
    });

    res.json({
      posts: transformedPosts,
      total: posts.count,
      page: Number(page),
      totalPages: Math.ceil(posts.count / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
};

export const getPostById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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
        {
          model: Reaction,
          as: 'reactions',
        },
      ],
    });

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    const postData = post.toJSON() as any;
    if (postData.isAnonymous) {
      postData.user = {
        displayName: getAnonymousDisplayName(post.id),
        isAnonymous: true,
      };
    }

    res.json({ post: postData });
  } catch (error) {
    next(error);
  }
};

export const deletePost = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const post = await Post.findByPk(id);

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    if (post.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    await post.destroy();

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    next(error);
  }
};

