import { Request, Response, NextFunction } from 'express';
import { Reaction, Post, Comment } from '../models/index.js';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { ReactionType } from '../models/Reaction.js';

/**
 * Toggle reaction on a post or comment
 */
export const toggleReaction = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { postId, commentId, reactionType } = req.body;

    // 1️⃣ Validate input
    if (!reactionType) {
      throw new AppError('reactionType is required', 400);
    }

    if (!postId && !commentId) {
      throw new AppError('postId or commentId is required', 400);
    }

    if (postId && commentId) {
      throw new AppError('Only one target allowed (post or comment)', 400);
    }

    // 2️⃣ Validate target exists
    if (postId) {
      const post = await Post.findByPk(postId);
      if (!post) throw new AppError('Post not found', 404);
    }

    if (commentId) {
      const comment = await Comment.findByPk(commentId);
      if (!comment) throw new AppError('Comment not found', 404);
    }

    // 3️⃣ Check existing reaction
    const existingReaction = await Reaction.findOne({
      where: {
        userId,
        postId: postId || null,
        commentId: commentId || null,
        reactionType,
      },
    });

    // 4️⃣ Toggle logic
    if (existingReaction) {
      await existingReaction.destroy();
      res.json({ message: 'Reaction removed' });
      return;
    }

    // 5️⃣ Create reaction
    const reaction = await Reaction.create({
      userId,
      postId: postId || null,
      commentId: commentId || null,
      reactionType,
    });

    res.status(201).json({
      message: 'Reaction added',
      reaction,
    });
  } catch (error) {
    next(error);
  }
};
