import { Request, Response, NextFunction } from 'express';
import MoodEntry from '../models/MoodEntry.js';
import { Op } from 'sequelize';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

export const getMoodEntries = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { limit = 30 } = req.query;

    const entries = await MoodEntry.findAll({
      where: { userId },
      limit: Number(limit),
      order: [['date', 'DESC']],
    });

    res.json({
      success: true,
      moodEntries: entries,
    });
  } catch (error) {
    next(error);
  }
};

export const createMoodEntry = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { mood, intensity, notes, date } = req.body;

    const entry = await MoodEntry.create({
      userId,
      mood,
      intensity,
      notes,
      date: date || new Date(),
    });

    res.json({
      success: true,
      data: entry,
    });
  } catch (error) {
    next(error);
  }
};

export const getMoodStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    const entries = await MoodEntry.findAll({
      where: {
        userId,
        date: {
          [Op.gte]: startDate,
        },
      },
      order: [['date', 'ASC']],
    });

    // Calculate mood distribution
    const moodDistribution: Record<string, number> = {};
    let totalIntensity = 0;

    entries.forEach((entry) => {
      moodDistribution[entry.mood] = (moodDistribution[entry.mood] || 0) + 1;
      totalIntensity += entry.intensity;
    });

    const averageIntensity = entries.length > 0 ? totalIntensity / entries.length : 0;

    res.json({
      success: true,
      averageIntensity: Math.round(averageIntensity * 10) / 10,
      totalEntries: entries.length,
      moodDistribution,
      entries: entries.map((e) => ({
        date: e.date,
        mood: e.mood,
        intensity: e.intensity,
      })),
    });
  } catch (error) {
    next(error);
  }
};

