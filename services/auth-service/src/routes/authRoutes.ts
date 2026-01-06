import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  verifyEmail,
  refreshToken,
  logout,
  validateToken,
} from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Register
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('username')
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('displayName').optional().isLength({ max: 100 }),
    validate,
  ],
  register,
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
  ],
  login,
);

// Verify email
router.post(
  '/verify-email',
  [body('token').notEmpty().withMessage('Verification token is required'), validate],
  verifyEmail,
);

// Refresh token
router.post(
  '/refresh',
  [body('refreshToken').notEmpty().withMessage('Refresh token is required'), validate],
  refreshToken,
);

// Logout
router.post('/logout', logout);

// Validate token (for inter-service communication)
router.get('/validate', validateToken);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'auth-service' });
});

export default router;

