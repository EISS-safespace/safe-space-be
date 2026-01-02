import { Router } from 'express';
import {
  uploadPostImages,
  uploadPostAudio,
  getPostMedia,
  deletePostMedia,
} from '../controllers/mediaController.js';
import { authenticate } from '../middleware/auth.js';
import { uploadImages, uploadSingleAudio } from '../middleware/upload.js';

const router = Router();

// Upload images to a post
router.post(
  '/posts/:postId/images',
  authenticate,
  uploadImages,
  uploadPostImages,
);

// Upload audio to a post
router.post(
  '/posts/:postId/audio',
  authenticate,
  uploadSingleAudio,
  uploadPostAudio,
);

// Get media for a post
router.get('/posts/:postId', authenticate, getPostMedia);

// Delete media from a post
router.delete('/posts/:postId/:mediaId', authenticate, deletePostMedia);

export default router;
