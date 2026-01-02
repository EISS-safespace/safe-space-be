import { Router } from 'express';
import { body } from 'express-validator';
import {
  createComment,
  getComments,
  updateComment,
  deleteComment,
} from '../controllers/commentController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = Router();

// Create comment on a post
router.post(
  '/posts/:postId/comments',
  authenticate,
  validate([
    body('content').notEmpty().withMessage('Content is required'),
    body('parentId').optional().isUUID(),
  ]),
  createComment,
);

// Get comments for a post
router.get('/posts/:postId/comments', optionalAuth, getComments);

// Update comment
router.put(
  '/:id',
  authenticate,
  validate([body('content').notEmpty().withMessage('Content is required')]),
  updateComment,
);

// Delete comment
router.delete('/:id', authenticate, deleteComment);

export default router;
