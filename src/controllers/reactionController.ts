import { Response, NextFunction } from 'express';
import { Reaction, Post, Comment } from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { ReactionType } from '../models/Reaction.js';

export const addReaction = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { reactableType, reactableId } = req.params;
    const { reactionType } = req.body;

    // Validate reactableType
    if (reactableType !== 'post' && reactableType !== 'comment') {
      throw new AppError('Invalid reactable type', 400);
    }

    // Validate reactionType
    if (!Object.values(ReactionType).includes(reactionType)) {
      throw new AppError('Invalid reaction type', 400);
    }

    // Verify the reactable exists
    if (reactableType === 'post') {
      const post = await Post.findByPk(reactableId);
      if (!post) {
        throw new AppError('Post not found', 404);
      }
    } else {
      const comment = await Comment.findByPk(reactableId);
      if (!comment) {
        throw new AppError('Comment not found', 404);
      }
    }

    // Check if reaction already exists
    const existingReaction = await Reaction.findOne({
      where: {
        userId,
        reactableType,
        reactableId,
        reactionType,
      },
    });

    if (existingReaction) {
      throw new AppError('Reaction already exists', 400);
    }

    // Create reaction
    const reaction = await Reaction.create({
      userId,
      reactableType,
      reactableId,
      reactionType,
    });

    res.status(201).json({
      message: 'Reaction added successfully',
      reaction,
    });
  } catch (error) {
    next(error);
  }
};

export const removeReaction = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { reactableType, reactableId, reactionType } = req.params;

    // Validate reactableType
    if (reactableType !== 'post' && reactableType !== 'comment') {
      throw new AppError('Invalid reactable type', 400);
    }

    const reaction = await Reaction.findOne({
      where: {
        userId,
        reactableType,
        reactableId,
        reactionType,
      },
    });

    if (!reaction) {
      throw new AppError('Reaction not found', 404);
    }

    await reaction.destroy();

    res.json({ message: 'Reaction removed successfully' });
  } catch (error) {
    next(error);
  }
};

export const getReactions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { reactableType, reactableId } = req.params;

    // Validate reactableType
    if (reactableType !== 'post' && reactableType !== 'comment') {
      throw new AppError('Invalid reactable type', 400);
    }

    const reactions = await Reaction.findAll({
      where: {
        reactableType,
        reactableId,
      },
    });

    // Group reactions by type and count
    const reactionCounts = reactions.reduce(
      (acc, reaction) => {
        const type = reaction.reactionType;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    res.json({
      reactions: reactionCounts,
      total: reactions.length,
    });
  } catch (error) {
    next(error);
  }
};
