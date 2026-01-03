import { Response, NextFunction } from 'express';
import { HopeStory, Quote, User } from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { StoryStatus, StoryCategory } from '../models/HopeStory.js';
import { QuoteCategory } from '../models/Quote.js';
import { getAnonymousDisplayName } from '../utils/anonymousAvatar.js';

// Hope Story endpoints
export const createStory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { title, content, category, isAnonymous } = req.body;

    // Auto-approve all stories (admin moderation panel is future scope)
    const story = await HopeStory.create({
      userId,
      title,
      content,
      category,
      isAnonymous: isAnonymous || false,
      status: StoryStatus.APPROVED,
      approvedAt: new Date(),
      approvedBy: userId,
    });

    res.status(201).json({
      message: 'Story published successfully!',
      story,
    });
  } catch (error) {
    next(error);
  }
};

export const getStories = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const {
      category,
      status = StoryStatus.APPROVED,
      page = 1,
      limit = 20,
    } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { status };
    if (category) where.category = category;

    const stories = await HopeStory.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'displayName', 'avatarUrl'],
        },
      ],
      order: [
        ['featuredAt', 'DESC NULLS LAST'],
        ['createdAt', 'DESC'],
      ],
      limit: Number(limit),
      offset,
    });

    // Transform stories to hide user info for anonymous stories
    const transformedStories = stories.rows.map((story) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const storyData = story.toJSON() as any;
      if (storyData.isAnonymous) {
        storyData.author = {
          displayName: getAnonymousDisplayName(story.id),
          isAnonymous: true,
        };
      }
      return storyData;
    });

    res.json({
      stories: transformedStories,
      total: stories.count,
      page: Number(page),
      totalPages: Math.ceil(stories.count / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
};

export const getStoryById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    const story = await HopeStory.findByPk(id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'displayName', 'avatarUrl'],
        },
      ],
    });

    if (!story) {
      throw new AppError('Story not found', 404);
    }

    // Increment view count
    await story.update({ viewCount: story.viewCount + 1 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const storyData = story.toJSON() as any;
    if (storyData.isAnonymous) {
      storyData.author = {
        displayName: getAnonymousDisplayName(story.id),
        isAnonymous: true,
      };
    }

    res.json({ story: storyData });
  } catch (error) {
    next(error);
  }
};

export const addCheckIn = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { checkInText } = req.body;

    const story = await HopeStory.findByPk(id);

    if (!story) {
      throw new AppError('Story not found', 404);
    }

    if (story.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    const updatedCheckIns = [...(story.checkIns || []), checkInText];

    await story.update({
      checkIns: updatedCheckIns,
      lastCheckInAt: new Date(),
    });

    res.json({
      message: 'Check-in added successfully',
      story,
    });
  } catch (error) {
    next(error);
  }
};

// Quote endpoints
export const getQuotes = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (category) where.category = category;

    const quotes = await Quote.findAndCountAll({
      where,
      order: [
        ['isFeatured', 'DESC'],
        ['createdAt', 'DESC'],
      ],
      limit: Number(limit),
      offset,
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

export const createQuote = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { text, author, category } = req.body;

    const quote = await Quote.create({
      text,
      author,
      category: category || QuoteCategory.GENERAL,
      submittedBy: userId,
      isFeatured: false,
    });

    res.status(201).json({
      message: 'Quote created successfully',
      quote,
    });
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    res.json({
      storyCategories: Object.values(StoryCategory),
      quoteCategories: Object.values(QuoteCategory),
    });
  } catch (error) {
    next(error);
  }
};

// Admin endpoints for story moderation
export const approveStory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const story = await HopeStory.findByPk(id);

    if (!story) {
      throw new AppError('Story not found', 404);
    }

    if (story.status !== StoryStatus.PENDING) {
      throw new AppError('Story is not pending approval', 400);
    }

    await story.update({
      status: StoryStatus.APPROVED,
      approvedAt: new Date(),
      approvedBy: userId,
      rejectionReason: null,
    });

    res.json({
      message: 'Story approved successfully',
      story,
    });
  } catch (error) {
    next(error);
  }
};

export const rejectStory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      throw new AppError('Rejection reason is required', 400);
    }

    const story = await HopeStory.findByPk(id);

    if (!story) {
      throw new AppError('Story not found', 404);
    }

    if (story.status !== StoryStatus.PENDING) {
      throw new AppError('Story is not pending approval', 400);
    }

    await story.update({
      status: StoryStatus.REJECTED,
      approvedBy: userId,
      rejectionReason: reason,
    });

    res.json({
      message: 'Story rejected',
      story,
    });
  } catch (error) {
    next(error);
  }
};

export const featureStory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { featured } = req.body;

    const story = await HopeStory.findByPk(id);

    if (!story) {
      throw new AppError('Story not found', 404);
    }

    if (story.status !== StoryStatus.APPROVED) {
      throw new AppError('Only approved stories can be featured', 400);
    }

    await story.update({
      featuredAt: featured ? new Date() : null,
    });

    res.json({
      message: featured
        ? 'Story featured successfully'
        : 'Story unfeatured successfully',
      story,
    });
  } catch (error) {
    next(error);
  }
};
