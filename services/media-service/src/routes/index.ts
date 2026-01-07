import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  uploadImage,
  uploadImages,
  getMedia,
  deleteMedia,
  uploadPostImages,
  uploadPostAudio,
} from '../controllers/mediaController.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'media-service' });
});

// Upload single image
router.post('/upload', authenticate, upload.single('image'), uploadImage);

// Upload multiple images
router.post('/upload-multiple', authenticate, upload.array('images', 5), uploadImages);

// Post media routes
router.post('/posts/:postId/images', authenticate, upload.array('images', 5), uploadPostImages);
router.post('/posts/:postId/audio', authenticate, upload.single('audio'), uploadPostAudio);

// Get media by ID
router.get('/:id', getMedia);

// Delete media
router.delete('/:id', authenticate, deleteMedia);

export default router;

