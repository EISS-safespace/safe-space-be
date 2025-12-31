import { Response, NextFunction } from 'express';
import { MoodEntry } from '../models/index.js';
import { AuthRequest } from '../middleware/auth.js';
import { Op } from 'sequelize';

export const createMoodEntry = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { mood, intensity, notes, date } = req.body;

    const moodEntry = await MoodEntry.create({
      userId,
      mood,
      intensity,
      notes,
      date: date || new Date(),
    });

    res.status(201).json({
      message: 'Mood entry created successfully',
      moodEntry,
    });
  } catch (error) {
    next(error);
  }
};

export const getMoodEntries = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { startDate, endDate } = req.query;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { userId };

    if (startDate && endDate) {
      where.date = {
        [Op.between]: [startDate, endDate],
      };
    }

    const moodEntries = await MoodEntry.findAll({
      where,
      order: [['date', 'DESC']],
    });

    res.json({ moodEntries });
  } catch (error) {
    next(error);
  }
};

export const getMoodStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    const moodEntries = await MoodEntry.findAll({
      where: {
        userId,
        date: {
          [Op.gte]: startDate,
        },
      },
      order: [['date', 'ASC']],
    });

    // Calculate statistics
    const moodCounts: Record<string, number> = {};
    let totalIntensity = 0;

    moodEntries.forEach((entry) => {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
      totalIntensity += entry.intensity;
    });

    const averageIntensity =
      moodEntries.length > 0 ? totalIntensity / moodEntries.length : 0;

    res.json({
      moodEntries,
      stats: {
        totalEntries: moodEntries.length,
        moodCounts,
        averageIntensity: averageIntensity.toFixed(2),
      },
    });
  } catch (error) {
    next(error);
  }
};
