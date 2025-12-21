import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { toggleReaction } from '../controllers/reactionController.js';

const router = Router();

/**
 * POST /api/reactions
 * Body: { postId OR commentId, reactionType }
 */
router.post('/', authenticate, toggleReaction);

export default router;
