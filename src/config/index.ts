import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10'),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
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
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedAudioTypes: ['audio/mpeg', 'audio/wav', 'audio/webm'],
  },
};

