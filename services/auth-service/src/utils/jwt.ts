import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';

export interface TokenPayload {
  userId: string;
  type?: 'access' | 'refresh';
}

export const generateAccessToken = (userId: string): string => {
  return jwt.sign({ userId, type: 'access' }, config.jwtSecret, {
    expiresIn: '15m', // Short-lived access token
  });
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { userId, type: 'refresh', jti: uuidv4() },
    config.jwtSecret,
    {
      expiresIn: '7d', // Long-lived refresh token
    },
  );
};

export const generateToken = (userId: string): string => {
  // Legacy function for backward compatibility
  return generateAccessToken(userId);
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
};

export const verifyAccessToken = (token: string): TokenPayload => {
  const payload = jwt.verify(token, config.jwtSecret) as TokenPayload;
  if (payload.type && payload.type !== 'access') {
    throw new Error('Invalid token type');
  }
  return payload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  const payload = jwt.verify(token, config.jwtSecret) as TokenPayload;
  if (payload.type && payload.type !== 'refresh') {
    throw new Error('Invalid token type');
  }
  return payload;
};
