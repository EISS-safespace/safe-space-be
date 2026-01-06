import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import path from 'path';
import fs from 'fs';
import routes from '../src/routes';
import { sequelize } from '../src/config/database';
import { PostMedia } from '../src/models';

// Mock auth middleware
const mockAuthMiddleware = (req: any, res: any, next: any) => {
  req.user = {
    id: 'test-user-id',
    email: 'test@example.com',
    username: 'testuser',
  };
  next();
};

// Create test app
const app = express();
app.use(express.json());
app.use(mockAuthMiddleware);
app.use('/', routes);

describe('Media Service Tests', () => {
  const testImagePath = path.join(__dirname, 'test-image.jpg');
  const uploadsDir = path.join(__dirname, '../uploads');

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create test image (1x1 pixel JPEG)
    const testImageBuffer = Buffer.from(
      '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=',
      'base64'
    );
    fs.writeFileSync(testImagePath, testImageBuffer);

    // Create uploads directory
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  });

  afterAll(async () => {
    await sequelize.close();

    // Clean up test files
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }

    // Clean up uploads directory
    if (fs.existsSync(uploadsDir)) {
      fs.rmSync(uploadsDir, { recursive: true, force: true });
    }
  });

  beforeEach(async () => {
    await PostMedia.destroy({ where: {}, truncate: true });
  });

  describe('POST /upload', () => {
    it('should upload an image successfully', async () => {
      const response = await request(app)
        .post('/upload')
        .attach('image', testImagePath);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.media).toBeDefined();
      expect(response.body.data.media.url).toBeDefined();
      expect(response.body.data.media.thumbnailUrl).toBeDefined();
    });

    it('should fail without file', async () => {
      const response = await request(app).post('/upload');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid file type', async () => {
      const txtFilePath = path.join(__dirname, 'test.txt');
      fs.writeFileSync(txtFilePath, 'test content');

      const response = await request(app)
        .post('/upload')
        .attach('image', txtFilePath);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);

      // Clean up
      fs.unlinkSync(txtFilePath);
    });
  });

  describe('POST /upload-multiple', () => {
    it('should upload multiple images', async () => {
      const response = await request(app)
        .post('/upload-multiple')
        .attach('images', testImagePath)
        .attach('images', testImagePath);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.media).toHaveLength(2);
    });

    it('should fail when uploading more than 5 images', async () => {
      const response = await request(app)
        .post('/upload-multiple')
        .attach('images', testImagePath)
        .attach('images', testImagePath)
        .attach('images', testImagePath)
        .attach('images', testImagePath)
        .attach('images', testImagePath)
        .attach('images', testImagePath); // 6th image

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /:id', () => {
    let mediaId: string;

    beforeEach(async () => {
      const media = await PostMedia.create({
        userId: 'test-user-id',
        url: '/uploads/test.jpg',
        thumbnailUrl: '/uploads/test-thumb.jpg',
        fileSize: 1024,
        mimeType: 'image/jpeg',
      });
      mediaId = media.id;
    });

    it('should get media by id', async () => {
      const response = await request(app).get(`/${mediaId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.media.id).toBe(mediaId);
    });

    it('should return 404 for non-existent media', async () => {
      const response = await request(app).get('/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /:id', () => {
    let mediaId: string;

    beforeEach(async () => {
      const media = await PostMedia.create({
        userId: 'test-user-id',
        url: '/uploads/test.jpg',
        thumbnailUrl: '/uploads/test-thumb.jpg',
        fileSize: 1024,
        mimeType: 'image/jpeg',
      });
      mediaId = media.id;
    });

    it('should delete media', async () => {
      const response = await request(app).delete(`/${mediaId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify media is deleted
      const media = await PostMedia.findByPk(mediaId);
      expect(media).toBeNull();
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.service).toBe('media-service');
    });
  });
});

