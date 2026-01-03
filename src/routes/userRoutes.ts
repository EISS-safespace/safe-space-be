import { Router } from 'express';
import { body } from 'express-validator';
import {
  getUserProfile,
  updateUserProfile,
  updateProfileDetails,
  getUserPosts,
  uploadAvatar,
  uploadCoverPhoto,
} from '../controllers/userController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { uploadSingleImage } from '../middleware/upload.js';

const router = Router();

// Get user profile by username
router.get('/:username', optionalAuth, getUserProfile);

// Get user posts by username
router.get('/:username/posts', optionalAuth, getUserPosts);

// Update user profile (authenticated)
router.put(
  '/profile',
  authenticate,
  validate([
    body('displayName').optional().isLength({ min: 1, max: 50 }),
    body('bio').optional().isLength({ max: 500 }),
    body('avatarUrl').optional().isURL(),
    body('coverPhotoUrl').optional().isURL(),
  ]),
  updateUserProfile,
);

// Update profile details (authenticated)
router.put(
  '/profile/details',
  authenticate,
  validate([
    body('interests').optional().isArray(),
    body('location').optional().isString(),
    body('website').optional().isURL(),
    body('pronouns').optional().isString(),
  ]),
  updateProfileDetails,
);

// Upload avatar
router.post('/profile/avatar', authenticate, uploadSingleImage, uploadAvatar);

// Upload cover photo
router.post(
  '/profile/cover',
  authenticate,
  uploadSingleImage,
  uploadCoverPhoto,
);

export default router;
