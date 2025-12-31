import { Router } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  logout,
  refreshAccessToken,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { config } from '../config/index.js';

const router = Router();

// Rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: config.rateLimit.authWindowMs,
  max: config.rateLimit.authMaxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Registration
router.post(
  '/register',
  authLimiter,
  validate([
    body('email').isEmail().withMessage('Invalid email'),
    body('username')
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage(
        'Username can only contain letters, numbers, and underscores',
      ),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      ),
    body('displayName')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Display name must be between 1 and 50 characters'),
  ]),
  register,
);

// Login
router.post(
  '/login',
  authLimiter,
  validate([
    body('email').isEmail().withMessage('Invalid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  login,
);

// Logout
router.post('/logout', authenticate, logout);

// Refresh access token
router.post('/refresh-token', refreshAccessToken);

// Email verification
router.post(
  '/verify-email',
  validate([body('token').notEmpty().withMessage('Token is required')]),
  verifyEmail,
);

// Resend verification email
router.post(
  '/resend-verification',
  authLimiter,
  validate([body('email').isEmail().withMessage('Invalid email')]),
  resendVerificationEmail,
);

// Forgot password
router.post(
  '/forgot-password',
  authLimiter,
  validate([body('email').isEmail().withMessage('Invalid email')]),
  forgotPassword,
);

// Reset password
router.post(
  '/reset-password',
  authLimiter,
  validate([
    body('token').notEmpty().withMessage('Token is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      ),
  ]),
  resetPassword,
);

// Change password (authenticated)
router.post(
  '/change-password',
  authenticate,
  validate([
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      ),
  ]),
  changePassword,
);

router.get('/profile', authenticate, getProfile);

export default router;
