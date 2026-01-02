import { Router } from 'express';
import { body } from 'express-validator';
import {
  createStory,
  getStories,
  getStoryById,
  addCheckIn,
  getQuotes,
  createQuote,
  getCategories,
} from '../controllers/hopeWallController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = Router();

// Story routes
router.post(
  '/stories',
  authenticate,
  validate([
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
    body('category')
      .isIn([
        'anxiety',
        'depression',
        'ptsd',
        'eating_disorder',
        'addiction',
        'grief',
        'trauma',
        'self_harm',
        'bipolar',
        'ocd',
        'general',
      ])
      .withMessage('Invalid category'),
  ]),
  createStory,
);

router.get('/stories', optionalAuth, getStories);

router.get('/stories/:id', optionalAuth, getStoryById);

router.post(
  '/stories/:id/checkin',
  authenticate,
  validate([
    body('checkInText').notEmpty().withMessage('Check-in text is required'),
  ]),
  addCheckIn,
);

// Quote routes
router.get('/quotes', optionalAuth, getQuotes);

router.post(
  '/quotes',
  authenticate,
  validate([
    body('text').notEmpty().withMessage('Quote text is required'),
    body('category')
      .optional()
      .isIn([
        'motivation',
        'hope',
        'strength',
        'recovery',
        'self_love',
        'mindfulness',
        'general',
      ])
      .withMessage('Invalid category'),
  ]),
  createQuote,
);

// Categories
router.get('/categories', getCategories);

export default router;
