import { Response, NextFunction } from 'express';
import { Reaction } from '../models/index.js';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { ReactionType } from '../models/Reaction.js';

/**
 * Add or toggle a reaction on a post or comment
 */
export const toggleReaction = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { postId, commentId, reactionType } = req.body;

    // ️❗ Validation
    if (!reactionType || !Object.values(ReactionType).includes(reactionType)) {
      throw new AppError('Invalid reaction type', 400);
    }

    if ((!postId && !commentId) || (postId && commentId)) {
      throw new AppError('Reaction must belong to either post or comment', 400);
    }

    // 🔎 Check existing reaction
    const existingReaction = await Reaction.findOne({
      where: {
        userId,
        reactionType,
        ...(postId ? { postId } : { commentId }),
      },
    });

    // 🔁 Toggle logic
    if (existingReaction) {
      await existingReaction.destroy();

      res.json({
        message: 'Reaction removed',
      });
      return;
    }

    // ➕ Create reaction
    const reaction = await Reaction.create({
      userId,
      reactionType,
      postId: postId || null,
      commentId: commentId || null,
    });

    res.status(201).json({
      message: 'Reaction added',
      reaction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a reaction by ID (author only)
 */
export const deleteReaction = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const reaction = await Reaction.findByPk(id);
    if (!reaction) {
      throw new AppError('Reaction not found', 404);
    }

    if (reaction.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    await reaction.destroy();

    res.json({
      message: 'Reaction deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
