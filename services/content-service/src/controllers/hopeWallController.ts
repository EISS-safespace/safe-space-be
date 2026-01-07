import { Response, NextFunction } from 'express';
import { HopeStory, Quote, User } from '../models/index.js';
import { StoryStatus } from '../models/HopeStory.js';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from './postController.js';

// Get all hope stories
export const getStories = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 20, status = 'approved' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const stories = await HopeStory.findAndCountAll({
      where: { status: status as StoryStatus },
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

// Get single hope story
export const getStory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const story = await HopeStory.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'displayName', 'avatarUrl'],
        },
      ],
    });

    if (!story) {
      throw new AppError('Story not found', 404);
    }

    res.json(story);
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

    const { title, content, category, isAnonymous } = req.body;

    const story = await HopeStory.create({
      userId: req.user.id,
      title,
      content,
      category: category || 'general',
      isAnonymous: isAnonymous || false,
      status: StoryStatus.APPROVED, // Auto-approve for now
      viewCount: 0,
    });

    const createdStory = await HopeStory.findByPk(story.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'displayName', 'avatarUrl'],
        },
      ],
    });

    res.status(201).json(createdStory);
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

// Get single quote
export const getQuote = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const quote = await Quote.findByPk(id);

    if (!quote) {
      throw new AppError('Quote not found', 404);
    }

    res.json(quote);
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

    const { text, author, category } = req.body;

    const quote = await Quote.create({
      text,
      author: author || 'Anonymous',
      category: category || 'general',
      submittedBy: req.user.id,
      isFeatured: false,
    });

    res.status(201).json(quote);
  } catch (error) {
    next(error);
  }
};

