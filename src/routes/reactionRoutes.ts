import { Router } from 'express';
import { body } from 'express-validator';
import {
  addReaction,
  removeReaction,
  getReactions,
} from '../controllers/reactionController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = Router();

// Add reaction to post or comment
router.post(
  '/:reactableType/:reactableId',
  authenticate,
  validate([
    body('reactionType')
      .isIn(['me_too', 'heart', 'hug', 'support', 'celebrate', 'helpful'])
      .withMessage('Invalid reaction type'),
  ]),
  addReaction,
);

// Get reactions for post or comment
router.get('/:reactableType/:reactableId', optionalAuth, getReactions);

// Remove reaction
router.delete(
  '/:reactableType/:reactableId/:reactionType',
  authenticate,
  removeReaction,
);

export default router;
