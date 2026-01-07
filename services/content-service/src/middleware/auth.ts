import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { config } from '../config/index.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    emailVerified: boolean;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    // Validate token with auth service
    const response = await axios.get(`${config.services.auth}/auth/validate`, {
      headers: { Authorization: authHeader },
    });

    if (response.data.valid) {
      req.user = response.data.user;
      next();
    } else {
      res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Optional authentication - doesn't fail if no token provided
export const optionalAuthenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    // If no auth header, just continue without setting req.user
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    // Validate token with auth service
    const response = await axios.get(`${config.services.auth}/auth/validate`, {
      headers: { Authorization: authHeader },
    });

    if (response.data.valid) {
      req.user = response.data.user;
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    // Don't fail, just continue without user
    next();
  }
};

