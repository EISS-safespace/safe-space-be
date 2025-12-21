import { Request, Response, NextFunction } from 'express';
import { Comment, Post } from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { getAnonymousDisplayName } from '../utils/anonymousAvatar.js';

/**
 * Create a comment on a post
 */
export const createComment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id: postId } = req.params;
    const { content, isAnonymous } = req.body;

    const post = await Post.findByPk(postId);
    if (!post) {
      throw new AppError('Post not found', 404);
    }

    const comment = await Comment.create({
      postId,
      userId,
      content,
      isAnonymous: isAnonymous || false,
    });

    const commentData = comment.toJSON() as any;
    if (commentData.isAnonymous) {
      commentData.user = {
        displayName: getAnonymousDisplayName(comment.id),
        isAnonymous: true,
      };
    }

    res.status(201).json({
      message: 'Comment created successfully',
      comment: commentData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Soft delete a comment
 */
export const deleteComment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const comment = await Comment.findByPk(id);
    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    if (comment.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    await comment.destroy();

    res.json({
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
/**
 * Update a comment (author only)
 */
export const updateComment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      throw new AppError('Content is required', 400);
    }

    const comment = await Comment.findByPk(id);
    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    if (comment.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    comment.content = content;
    await comment.save();

    res.json({
      message: 'Comment updated successfully',
      comment,
    });
  } catch (error) {
    next(error);
  }
};
/**
 * Reply to a comment
 */
export const replyToComment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id: parentId } = req.params;
    const { content, isAnonymous } = req.body;

    if (!content || content.trim() === '') {
      throw new AppError('Content is required', 400);
    }

    // 1. Find parent comment
    const parentComment = await Comment.findByPk(parentId);
    if (!parentComment) {
      throw new AppError('Parent comment not found', 404);
    }

    // 2. Create reply
    const reply = await Comment.create({
      postId: parentComment.postId,
      parentId,
      userId,
      content,
      isAnonymous: isAnonymous || false,
    });

    // 3. Handle anonymous reply
    const replyData = reply.toJSON() as any;
    if (replyData.isAnonymous) {
      replyData.user = {
        displayName: getAnonymousDisplayName(reply.id),
        isAnonymous: true,
      };
    }

    res.status(201).json({
      message: 'Reply created successfully',
      comment: replyData,
    });
  } catch (error) {
    next(error);
  }
};
