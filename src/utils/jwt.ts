import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

export const verifyToken = (token: string): { userId: string } => {
  return jwt.verify(token, config.jwtSecret) as { userId: string };
};

