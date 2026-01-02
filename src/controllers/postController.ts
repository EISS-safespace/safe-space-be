import { Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import {
  Post,
  User,
  Comment,
  Reaction,
  PostRevision,
} from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { getAnonymousDisplayName } from '../utils/anonymousAvatar.js';

export const createPost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.userId!;
    const {
      content,
      isAnonymous,
      postType,
      triggerWarnings,
      mood,
      imageUrls,
      audioUrl,
      isDraft,
      scheduledFor,
    } = req.body;

    const post = await Post.create({
      userId,
      content,
      isAnonymous: isAnonymous || false,
      postType,
      triggerWarnings: triggerWarnings || [],
      mood,
      imageUrls: imageUrls || [],
      audioUrl,
      isDraft: isDraft || false,
      scheduledFor: scheduledFor || null,
    });

    res.status(201).json({
      message: 'Post created successfully',
      post,
    });
  } catch (error) {
    next(error);
  }
};

export const getPosts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { mood, postType, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      deletedAt: null, // Exclude soft-deleted posts
      isDraft: false, // Exclude drafts
      [Op.or]: [
        { scheduledFor: null },
        { scheduledFor: { [Op.lte]: new Date() } }, // Only show scheduled posts that are due
      ],
    };
    if (mood) where.mood = mood;
    if (postType) where.postType = postType;

    const posts = await Post.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: [
            'id',
            'username',
            'displayName',
            'avatarUrl',
            'isVerifiedTherapist',
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    // Transform posts to hide user info for anonymous posts
    const transformedPosts = posts.rows.map((post) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export const getPostById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    const post = await Post.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: [
            'id',
            'username',
            'displayName',
            'avatarUrl',
            'isVerifiedTherapist',
          ],
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export const updatePost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { content, triggerWarnings, imageUrls, audioUrl, postType, mood } =
      req.body;

    const post = await Post.findByPk(id);

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    if (post.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    if (post.deletedAt) {
      throw new AppError('Cannot update deleted post', 400);
    }

    // Create revision before updating
    await PostRevision.create({
      postId: post.id,
      content: post.content,
      triggerWarnings: post.triggerWarnings,
      imageUrls: post.imageUrls || [],
      audioUrl: post.audioUrl || undefined,
      editedBy: userId,
    });

    // Update post
    await post.update({
      content: content || post.content,
      triggerWarnings: triggerWarnings || post.triggerWarnings,
      imageUrls: imageUrls || post.imageUrls,
      audioUrl: audioUrl !== undefined ? audioUrl : post.audioUrl,
      postType: postType || post.postType,
      mood: mood !== undefined ? mood : post.mood,
      isEdited: true,
      editedAt: new Date(),
    });

    res.json({
      message: 'Post updated successfully',
      post,
    });
  } catch (error) {
    next(error);
  }
};

export const deletePost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { permanent } = req.query;

    const post = await Post.findByPk(id);

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    if (post.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    if (permanent === 'true') {
      // Permanent delete
      await post.destroy();
      res.json({ message: 'Post permanently deleted' });
    } else {
      // Soft delete
      await post.update({ deletedAt: new Date() });
      res.json({ message: 'Post deleted successfully' });
    }
  } catch (error) {
    next(error);
  }
};
