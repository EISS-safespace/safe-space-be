import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, getProfile } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = Router();

router.post(
  '/register',
  validate([
    body('email').isEmail().withMessage('Invalid email'),
    body('username')
      .isLength({ min: 3 })
      .withMessage('Username must be at least 3 characters'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ]),
  register,
);

router.post(
  '/login',
  validate([
    body('email').isEmail().withMessage('Invalid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  login,
);

router.get('/profile', authenticate, getProfile);

export default router;
