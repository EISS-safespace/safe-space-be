import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { rateLimiter } from './middleware/rateLimiter';
import { logger } from './config/logger';
import { serviceRoutes } from './routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// Middleware
// ============================================

// Security headers
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Request logging
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim()),
  },
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(rateLimiter);

// ============================================
// Health Check
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'SafeSpace API Gateway',
    version: '1.0.0',
    documentation: '/api/docs',
  });
});

// ============================================
// Service Proxies
// ============================================

// Auth Service
app.use('/api/auth', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3002',
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '' },
  onError: (err, req, res) => {
    logger.error('Auth Service Proxy Error:', err);
    (res as Response).status(503).json({ error: 'Auth service unavailable' });
  },
}));

// User Service
app.use('/api/users', createProxyMiddleware({
  target: process.env.USER_SERVICE_URL || 'http://user-service:3003',
  changeOrigin: true,
  pathRewrite: { '^/api/users': '' },
  onError: (err, req, res) => {
    logger.error('User Service Proxy Error:', err);
    (res as Response).status(503).json({ error: 'User service unavailable' });
  },
}));

// Content Service
app.use('/api/posts', createProxyMiddleware({
  target: process.env.CONTENT_SERVICE_URL || 'http://content-service:3004',
  changeOrigin: true,
  pathRewrite: { '^/api/posts': '/posts' },
  onError: (err, req, res) => {
    logger.error('Content Service Proxy Error:', err);
    (res as Response).status(503).json({ error: 'Content service unavailable' });
  },
}));

app.use('/api/comments', createProxyMiddleware({
  target: process.env.CONTENT_SERVICE_URL || 'http://content-service:3004',
  changeOrigin: true,
  pathRewrite: { '^/api/comments': '/comments' },
}));

app.use('/api/hope-wall', createProxyMiddleware({
  target: process.env.CONTENT_SERVICE_URL || 'http://content-service:3004',
  changeOrigin: true,
  pathRewrite: { '^/api/hope-wall': '/hope-wall' },
}));

// Mood Service
app.use('/api/mood', createProxyMiddleware({
  target: process.env.MOOD_SERVICE_URL || 'http://mood-service:3005',
  changeOrigin: true,
  pathRewrite: { '^/api/mood': '' },
  onError: (err, req, res) => {
    logger.error('Mood Service Proxy Error:', err);
    (res as Response).status(503).json({ error: 'Mood service unavailable' });
  },
}));

// Chat Service
app.use('/api/chat', createProxyMiddleware({
  target: process.env.CHAT_SERVICE_URL || 'http://chat-service:3006',
  changeOrigin: true,
  pathRewrite: { '^/api/chat': '' },
  ws: true, // Enable WebSocket proxying
  onError: (err, req, res) => {
    logger.error('Chat Service Proxy Error:', err);
    (res as Response).status(503).json({ error: 'Chat service unavailable' });
  },
}));

// Moderation Service
app.use('/api/moderation', createProxyMiddleware({
  target: process.env.MODERATION_SERVICE_URL || 'http://moderation-service:3007',
  changeOrigin: true,
  pathRewrite: { '^/api/moderation': '' },
}));

// Wellness Service
app.use('/api/wellness', createProxyMiddleware({
  target: process.env.WELLNESS_SERVICE_URL || 'http://wellness-service:3008',
  changeOrigin: true,
  pathRewrite: { '^/api/wellness': '' },
}));

// Professional Service
app.use('/api/professional', createProxyMiddleware({
  target: process.env.PROFESSIONAL_SERVICE_URL || 'http://professional-service:3009',
  changeOrigin: true,
  pathRewrite: { '^/api/professional': '' },
}));

// Media Service
app.use('/api/media', createProxyMiddleware({
  target: process.env.MEDIA_SERVICE_URL || 'http://media-service:3010',
  changeOrigin: true,
  pathRewrite: { '^/api/media': '' },
}));

// Notification Service
app.use('/api/notifications', createProxyMiddleware({
  target: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3011',
  changeOrigin: true,
  pathRewrite: { '^/api/notifications': '' },
}));

// ============================================
// Error Handling
// ============================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
  logger.error('Unhandled Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// ============================================
// Start Server
// ============================================

const server = app.listen(PORT, () => {
  logger.info(`🚀 API Gateway running on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;

