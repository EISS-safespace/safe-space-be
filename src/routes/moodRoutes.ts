import { Router } from 'express';
import { body } from 'express-validator';
import {
  createMoodEntry,
  getMoodEntries,
  getMoodStats,
} from '../controllers/moodController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = Router();

router.post(
  '/',
  authenticate,
  validate([
    body('mood').notEmpty().withMessage('Mood is required'),
    body('intensity')
      .isInt({ min: 1, max: 10 })
      .withMessage('Intensity must be between 1 and 10'),
  ]),
  createMoodEntry,
);

router.get('/', authenticate, getMoodEntries);

router.get('/stats', authenticate, getMoodStats);

export default router;
