import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';

export interface TokenPayload {
  userId: string;
  type?: 'access' | 'refresh';
}

export const generateAccessToken = (userId: string): string => {
  return jwt.sign(
    { userId, type: 'access' },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn as any }
  );
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { userId, type: 'refresh', jti: uuidv4() },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshExpiresIn as any }
  );
};

export const generateToken = (userId: string): string => {
  // Legacy function for backward compatibility
  return generateAccessToken(userId);
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.secret) as TokenPayload;
};

export const verifyAccessToken = (token: string): TokenPayload => {
  const payload = jwt.verify(token, config.jwt.secret) as TokenPayload;
  if (payload.type && payload.type !== 'access') {
    throw new Error('Invalid token type');
  }
  return payload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  const payload = jwt.verify(token, config.jwt.secret) as TokenPayload;
  if (payload.type && payload.type !== 'refresh') {
    throw new Error('Invalid token type');
  }
  return payload;
};
