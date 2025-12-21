import { Router } from 'express';

import authRoutes from './authRoutes.js';
import postRoutes from './postRoutes.js';
import commentRoutes from './commentRoutes.js';
import reactionRoutes from './reactionRoutes.js'; // ✅ ADD HERE

const router = Router();

router.use('/auth', authRoutes);
router.use('/posts', postRoutes);
router.use('/comments', commentRoutes);
router.use('/reactions', reactionRoutes); // ✅ AND MOUNT HERE

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default router;
