"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_proxy_middleware_1 = require("http-proxy-middleware");
const rateLimiter_1 = require("./middleware/rateLimiter");
const logger_1 = require("./config/logger");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, helmet_1.default)());
const corsOptions = {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
    optionsSuccessStatus: 200,
};
app.use((0, cors_1.default)(corsOptions));
app.use((0, morgan_1.default)('combined', {
    stream: {
        write: (message) => logger_1.logger.info(message.trim()),
    },
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use(rateLimiter_1.rateLimiter);
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'api-gateway',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'SafeSpace API Gateway',
        version: '1.0.0',
        documentation: '/api/docs',
    });
});
app.use('/api/auth', (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3002',
    changeOrigin: true,
    pathRewrite: { '^/api/auth': '' },
    onError: (err, req, res) => {
        logger_1.logger.error('Auth Service Proxy Error:', err);
        res.status(503).json({ error: 'Auth service unavailable' });
    },
}));
app.use('/api/users', (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: process.env.USER_SERVICE_URL || 'http://user-service:3003',
    changeOrigin: true,
    pathRewrite: { '^/api/users': '' },
    onError: (err, req, res) => {
        logger_1.logger.error('User Service Proxy Error:', err);
        res.status(503).json({ error: 'User service unavailable' });
    },
}));
app.use('/api/posts', (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: process.env.CONTENT_SERVICE_URL || 'http://content-service:3004',
    changeOrigin: true,
    pathRewrite: { '^/api/posts': '/posts' },
    onError: (err, req, res) => {
        logger_1.logger.error('Content Service Proxy Error:', err);
        res.status(503).json({ error: 'Content service unavailable' });
    },
}));
app.use('/api/comments', (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: process.env.CONTENT_SERVICE_URL || 'http://content-service:3004',
    changeOrigin: true,
    pathRewrite: { '^/api/comments': '/comments' },
}));
app.use('/api/hope-wall', (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: process.env.CONTENT_SERVICE_URL || 'http://content-service:3004',
    changeOrigin: true,
    pathRewrite: { '^/api/hope-wall': '/hope-wall' },
}));
app.use('/api/mood', (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: process.env.MOOD_SERVICE_URL || 'http://mood-service:3005',
    changeOrigin: true,
    pathRewrite: { '^/api/mood': '' },
    onError: (err, req, res) => {
        logger_1.logger.error('Mood Service Proxy Error:', err);
        res.status(503).json({ error: 'Mood service unavailable' });
    },
}));
app.use('/api/chat', (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: process.env.CHAT_SERVICE_URL || 'http://chat-service:3006',
    changeOrigin: true,
    pathRewrite: { '^/api/chat': '' },
    ws: true,
    onError: (err, req, res) => {
        logger_1.logger.error('Chat Service Proxy Error:', err);
        res.status(503).json({ error: 'Chat service unavailable' });
    },
}));
app.use('/api/moderation', (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: process.env.MODERATION_SERVICE_URL || 'http://moderation-service:3007',
    changeOrigin: true,
    pathRewrite: { '^/api/moderation': '' },
}));
app.use('/api/wellness', (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: process.env.WELLNESS_SERVICE_URL || 'http://wellness-service:3008',
    changeOrigin: true,
    pathRewrite: { '^/api/wellness': '' },
}));
app.use('/api/professional', (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: process.env.PROFESSIONAL_SERVICE_URL || 'http://professional-service:3009',
    changeOrigin: true,
    pathRewrite: { '^/api/professional': '' },
}));
app.use('/api/media', (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: process.env.MEDIA_SERVICE_URL || 'http://media-service:3010',
    changeOrigin: true,
    pathRewrite: { '^/api/media': '' },
}));
app.use('/api/notifications', (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3011',
    changeOrigin: true,
    pathRewrite: { '^/api/notifications': '' },
}));
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
    });
});
app.use((err, req, res, next) => {
    logger_1.logger.error('Unhandled Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    });
});
const server = app.listen(PORT, () => {
    logger_1.logger.info(`🚀 API Gateway running on port ${PORT}`);
    logger_1.logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger_1.logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
});
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        logger_1.logger.info('HTTP server closed');
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    logger_1.logger.info('SIGINT signal received: closing HTTP server');
    server.close(() => {
        logger_1.logger.info('HTTP server closed');
        process.exit(0);
    });
});
exports.default = app;
//# sourceMappingURL=index.js.map