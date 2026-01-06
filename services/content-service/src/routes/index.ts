import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
} from '../controllers/postController.js';
import {
  getStories,
  createStory,
  getQuotes,
  createQuote,
} from '../controllers/hopeWallController.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'content-service' });
});

// Post routes
router.get('/posts', getPosts);
router.get('/posts/:id', getPost);
router.post(
  '/posts',
  authenticate,
  [
    body('content').notEmpty().withMessage('Content is required'),
    body('type').optional().isIn(['text', 'image', 'poll']),
    validate,
  ],
  createPost,
);
router.put('/posts/:id', authenticate, updatePost);
router.delete('/posts/:id', authenticate, deletePost);

// Hope Wall routes
router.get('/hope-wall/stories', getStories);
router.post(
  '/hope-wall/stories',
  authenticate,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
    validate,
  ],
  createStory,
);

router.get('/hope-wall/quotes', getQuotes);
router.post(
  '/hope-wall/quotes',
  authenticate,
  [
    body('text').notEmpty().withMessage('Quote text is required'),
    body('author').notEmpty().withMessage('Author is required'),
    validate,
  ],
  createQuote,
);

export default router;

