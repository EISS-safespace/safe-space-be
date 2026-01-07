import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  updatePostMedia,
} from '../controllers/postController.js';
import {
  getStories,
  getStory,
  createStory,
  getQuotes,
  getQuote,
  createQuote,
} from '../controllers/hopeWallController.js';
import {
  getMoodEntries,
  createMoodEntry,
  getMoodStats,
} from '../controllers/moodController.js';
import {
  getUserProfile,
  getUserPosts,
  updateProfile,
  uploadAvatar,
  uploadCoverPhoto,
} from '../controllers/userController.js';
import { upload } from '../middleware/upload.js';

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
router.patch('/posts/:id/media', authenticate, updatePostMedia);
router.delete('/posts/:id', authenticate, deletePost);

// Hope Wall routes
router.get('/hope-wall/stories', getStories);
router.get('/hope-wall/stories/:id', getStory);
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
router.get('/hope-wall/quotes/:id', getQuote);
router.post(
  '/hope-wall/quotes',
  authenticate,
  [
    body('text').notEmpty().withMessage('Quote text is required'),
    body('author').optional(),
    body('category').optional(),
    validate,
  ],
  createQuote,
);

// Mood routes
router.get('/mood', authenticate, getMoodEntries);
router.post('/mood', authenticate, createMoodEntry);
router.get('/mood/stats', authenticate, getMoodStats);

// User routes
router.get('/users/:username', optionalAuthenticate, getUserProfile);
router.get('/users/:username/posts', getUserPosts);
router.put('/users/profile', authenticate, updateProfile);
router.post('/users/profile/avatar', authenticate, upload.single('image'), uploadAvatar);
router.post('/users/profile/cover', authenticate, upload.single('image'), uploadCoverPhoto);

export default router;

