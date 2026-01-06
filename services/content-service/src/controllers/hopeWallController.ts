import { Response, NextFunction } from 'express';
import { HopeStory, Quote, User } from '../models/index.js';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from './postController.js';

// Get all hope stories
export const getStories = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 20, status = 'approved' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const stories = await HopeStory.findAndCountAll({
      where: { status },
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'displayName', 'avatarUrl'],
        },
      ],
    });

    res.json({
      stories: stories.rows,
      total: stories.count,
      page: Number(page),
      totalPages: Math.ceil(stories.count / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
};

// Create hope story
export const createStory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { title, content, isAnonymous } = req.body;

    const story = await HopeStory.create({
      userId: req.user.id,
      title,
      content,
      isAnonymous: isAnonymous || false,
      status: 'approved', // Auto-approve for now
      likesCount: 0,
      sharesCount: 0,
    });

    res.status(201).json(story);
  } catch (error) {
    next(error);
  }
};

// Get all quotes
export const getQuotes = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const quotes = await Quote.findAndCountAll({
      where: { isActive: true },
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      quotes: quotes.rows,
      total: quotes.count,
      page: Number(page),
      totalPages: Math.ceil(quotes.count / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
};

// Create quote
export const createQuote = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const { text, author } = req.body;

    const quote = await Quote.create({
      text,
      author,
      submittedBy: req.user.id,
      isActive: true,
    });

    res.status(201).json(quote);
  } catch (error) {
    next(error);
  }
};

