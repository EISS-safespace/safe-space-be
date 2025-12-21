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
 * Reply to a comment
 */
router.post('/:id/replies', authenticate, replyToComment);

/**
 * PUT /api/comments/:id
 * Update a comment (author only)
 */
router.put('/:id', authenticate, updateComment);

/**
 * DELETE /api/comments/:id
 * Soft delete a comment (author only)
 */
router.delete('/:id', authenticate, deleteComment);

export default router;
