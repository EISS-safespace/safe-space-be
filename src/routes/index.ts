import { Router } from 'express';
import authRoutes from './authRoutes.js';
import postRoutes from './postRoutes.js';
import moodRoutes from './moodRoutes.js';
import commentRoutes from './commentRoutes.js';
import reactionRoutes from './reactionRoutes.js';
import hopeWallRoutes from './hopeWallRoutes.js';
import mediaRoutes from './mediaRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/posts', postRoutes);
router.use('/mood', moodRoutes);
router.use('/comments', commentRoutes);
router.use('/reactions', reactionRoutes);
router.use('/hope-wall', hopeWallRoutes);
router.use('/media', mediaRoutes);

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'SafeSpace API is running' });
});

export default router;
