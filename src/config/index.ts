import dotenv from 'dotenv';
import { Secret } from 'jsonwebtoken';
import type { StringValue } from 'ms';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: (process.env.JWT_SECRET ||
    'your-secret-key-change-in-production') as Secret,
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN || '7d') as StringValue,
  jwtRefreshExpiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ||
    '30d') as StringValue,
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10'),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  database: {
    name: process.env.DB_NAME || 'safespace_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
  },
  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY || '',
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB default
    maxImageSize: parseInt(process.env.MAX_IMAGE_SIZE || '5242880'), // 5MB
    maxAudioSize: parseInt(process.env.MAX_AUDIO_SIZE || '10485760'), // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedAudioTypes: ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg'],
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    imageQuality: parseInt(process.env.IMAGE_QUALITY || '80'),
    thumbnailWidth: parseInt(process.env.THUMBNAIL_WIDTH || '300'),
    thumbnailHeight: parseInt(process.env.THUMBNAIL_HEIGHT || '300'),
    maxImagesPerPost: parseInt(process.env.MAX_IMAGES_PER_POST || '5'),
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    s3Bucket: process.env.AWS_S3_BUCKET || 'safespace-media',
    cloudFrontUrl: process.env.AWS_CLOUDFRONT_URL || '',
  },
  auth: {
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '900000'), // 15 minutes in ms
    verificationTokenExpiry: parseInt(
      process.env.VERIFICATION_TOKEN_EXPIRY || '86400000',
    ), // 24 hours in ms
    passwordResetTokenExpiry: parseInt(
      process.env.PASSWORD_RESET_TOKEN_EXPIRY || '3600000',
    ), // 1 hour in ms
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    authWindowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    authMaxRequests: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '5'),
  },
};
