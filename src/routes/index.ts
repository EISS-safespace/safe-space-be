import commentRoutes from './commentRoutes.js';
import { Router } from 'express';
import authRoutes from './authRoutes.js';
import postRoutes from './postRoutes.js';
import moodRoutes from './moodRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/posts', postRoutes);
router.use('/mood', moodRoutes);
router.use('/comments', commentRoutes);


// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'SafeSpace API is running' });
});

export default router;

