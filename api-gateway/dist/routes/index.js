"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceRoutes = void 0;
exports.serviceRoutes = {
    auth: {
        prefix: '/api/auth',
        target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3002',
    },
    users: {
        prefix: '/api/users',
        target: process.env.USER_SERVICE_URL || 'http://user-service:3003',
    },
    content: {
        prefix: '/api/posts',
        target: process.env.CONTENT_SERVICE_URL || 'http://content-service:3004',
    },
    mood: {
        prefix: '/api/mood',
        target: process.env.MOOD_SERVICE_URL || 'http://mood-service:3005',
    },
    chat: {
        prefix: '/api/chat',
        target: process.env.CHAT_SERVICE_URL || 'http://chat-service:3006',
    },
    moderation: {
        prefix: '/api/moderation',
        target: process.env.MODERATION_SERVICE_URL || 'http://moderation-service:3007',
    },
    wellness: {
        prefix: '/api/wellness',
        target: process.env.WELLNESS_SERVICE_URL || 'http://wellness-service:3008',
    },
    professional: {
        prefix: '/api/professional',
        target: process.env.PROFESSIONAL_SERVICE_URL || 'http://professional-service:3009',
    },
    media: {
        prefix: '/api/media',
        target: process.env.MEDIA_SERVICE_URL || 'http://media-service:3010',
    },
    notifications: {
        prefix: '/api/notifications',
        target: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3011',
    },
};
//# sourceMappingURL=index.js.map