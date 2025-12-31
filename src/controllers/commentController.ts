import { Response, NextFunction } from 'express';
import { Comment, User } from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { getAnonymousDisplayName } from '../utils/anonymousAvatar.js';

interface CommentData {
  id: string;
  parentId: string | null;
  [key: string]: unknown;
}

// Helper function to build nested comment tree
const buildCommentTree = (
  comments: CommentData[],
  parentId: string | null = null,
): CommentData[] => {
  return comments
    .filter((comment: CommentData) => comment.parentId === parentId)
    .map((comment: CommentData) => {
      return {
        ...comment,
        replies: buildCommentTree(comments, comment.id),
      };
    });
};

export const createComment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { postId } = req.params;
    const { content, isAnonymous, parentId } = req.body;

    const comment = await Comment.create({
      postId,
      userId,
      content,
      isAnonymous: isAnonymous || false,
      parentId: parentId || null,
    });

    const createdComment = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'displayName', 'avatarUrl'],
        },
      ],
    });

    res.status(201).json({
      message: 'Comment created successfully',
      comment: createdComment,
    });
  } catch (error) {
    next(error);
  }
};

export const getComments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const comments = await Comment.findAndCountAll({
      where: {
        postId,
        deletedAt: null, // Exclude soft-deleted comments
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'displayName', 'avatarUrl'],
        },
      ],
      order: [['createdAt', 'ASC']],
      limit: Number(limit),
      offset,
    });

    // Transform comments to hide user info for anonymous comments
    const transformedComments = comments.rows.map((comment) => {
      const commentData = comment.toJSON() as unknown as CommentData;
      if (commentData.isAnonymous) {
        commentData.user = {
          displayName: getAnonymousDisplayName(comment.id),
          isAnonymous: true,
        };
      }
      return commentData;
    });

    // Build nested tree structure
    const commentTree = buildCommentTree(transformedComments);

    res.json({
      comments: commentTree,
      total: comments.count,
      page: Number(page),
      totalPages: Math.ceil(comments.count / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
};

export const updateComment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { content } = req.body;

    const comment = await Comment.findByPk(id);

    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    if (comment.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    if (comment.deletedAt) {
      throw new AppError('Cannot update deleted comment', 400);
    }

    await comment.update({
      content,
      isEdited: true,
      editedAt: new Date(),
    });

    res.json({
      message: 'Comment updated successfully',
      comment,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { permanent } = req.query;

    const comment = await Comment.findByPk(id);

    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    if (comment.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    if (permanent === 'true') {
      // Permanent delete
      await comment.destroy();
      res.json({ message: 'Comment permanently deleted' });
    } else {
      // Soft delete
      await comment.update({ deletedAt: new Date() });
      res.json({ message: 'Comment deleted successfully' });
    }
  } catch (error) {
    next(error);
  }
};
