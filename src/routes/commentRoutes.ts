import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  deleteComment,
  updateComment,
  replyToComment,
} from '../controllers/commentController.js';

const router = Router();

/**
 * POST /api/comments/:id/replies
 */
router.post('/:id/replies', authenticate, replyToComment);

/**
 * PUT /api/comments/:id
 */
router.put('/:id', authenticate, updateComment);

/**
 * DELETE /api/comments/:id
 */
router.delete('/:id', authenticate, deleteComment);

export default router;
