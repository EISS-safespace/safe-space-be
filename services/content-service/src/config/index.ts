import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3004'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL,
  },
  
  services: {
    auth: process.env.AUTH_SERVICE_URL || 'http://auth-service:3002',
    moderation: process.env.MODERATION_SERVICE_URL || 'http://moderation-service:3007',
    media: process.env.MEDIA_SERVICE_URL || 'http://media-service:3010',
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  },
};

