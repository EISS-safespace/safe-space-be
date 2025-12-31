import { Router } from 'express';
import { body } from 'express-validator';
import {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
} from '../controllers/postController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = Router();

router.post(
  '/',
  authenticate,
  validate([
    body('content').notEmpty().withMessage('Content is required'),
    body('postType')
      .isIn(['vent', 'success', 'question', 'general'])
      .withMessage('Invalid post type'),
  ]),
  createPost,
);

router.get('/', optionalAuth, getPosts);

router.get('/:id', optionalAuth, getPostById);

router.put(
  '/:id',
  authenticate,
  validate([body('content').optional().notEmpty()]),
  updatePost,
);

router.delete('/:id', authenticate, deletePost);

export default router;
