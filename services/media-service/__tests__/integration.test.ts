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

const app = express();
app.use(express.json());
app.use(mockAuthMiddleware);
app.use('/', routes);

describe('Media Service Integration Tests', () => {
  const testImagePath = path.join(__dirname, 'test-image.jpg');
  const uploadsDir = path.join(__dirname, '../uploads');

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create test image
    const testImageBuffer = Buffer.from(
      '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=',
      'base64'
    );
    fs.writeFileSync(testImagePath, testImageBuffer);

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  });

  afterAll(async () => {
    await sequelize.close();

    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }

    if (fs.existsSync(uploadsDir)) {
      fs.rmSync(uploadsDir, { recursive: true, force: true });
    }
  });

  beforeEach(async () => {
    await PostMedia.destroy({ where: {}, truncate: true });
  });

  describe('Media Upload Lifecycle', () => {
    it('should handle complete upload -> retrieve -> delete lifecycle', async () => {
      // Upload image
      const uploadResponse = await request(app)
        .post('/upload')
        .attach('image', testImagePath);

      expect(uploadResponse.status).toBe(201);
      const mediaId = uploadResponse.body.data.media.id;

      // Retrieve media
      const getResponse = await request(app).get(`/${mediaId}`);
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.data.media.id).toBe(mediaId);

      // Delete media
      const deleteResponse = await request(app).delete(`/${mediaId}`);
      expect(deleteResponse.status).toBe(200);

      // Verify deletion
      const verifyResponse = await request(app).get(`/${mediaId}`);
      expect(verifyResponse.status).toBe(404);
    });
  });

  describe('Multiple Image Upload', () => {
    it('should handle uploading and managing multiple images', async () => {
      // Upload multiple images
      const uploadResponse = await request(app)
        .post('/upload-multiple')
        .attach('images', testImagePath)
        .attach('images', testImagePath)
        .attach('images', testImagePath);

      expect(uploadResponse.status).toBe(201);
      expect(uploadResponse.body.data.media.length).toBe(3);

      const mediaIds = uploadResponse.body.data.media.map((m: any) => m.id);

      // Verify all images were created
      for (const id of mediaIds) {
        const response = await request(app).get(`/${id}`);
        expect(response.status).toBe(200);
      }

      // Delete all images
      for (const id of mediaIds) {
        const response = await request(app).delete(`/${id}`);
        expect(response.status).toBe(200);
      }
    });
  });

  describe('Image Processing Verification', () => {
    it('should create both original and thumbnail URLs', async () => {
      const response = await request(app)
        .post('/upload')
        .attach('image', testImagePath);

      expect(response.status).toBe(201);
      expect(response.body.data.media.url).toBeDefined();
      expect(response.body.data.media.thumbnailUrl).toBeDefined();
      expect(response.body.data.media.url).not.toBe(
        response.body.data.media.thumbnailUrl
      );
    });

    it('should store correct metadata', async () => {
      const response = await request(app)
        .post('/upload')
        .attach('image', testImagePath);

      expect(response.status).toBe(201);
      const media = response.body.data.media;

      expect(media.mimeType).toBe('image/jpeg');
      expect(media.fileSize).toBeGreaterThan(0);
      expect(media.userId).toBe('test-user-id');
    });
  });

  describe('File Validation', () => {
    it('should reject non-image files', async () => {
      const txtFilePath = path.join(__dirname, 'test.txt');
      fs.writeFileSync(txtFilePath, 'test content');

      const response = await request(app)
        .post('/upload')
        .attach('image', txtFilePath);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);

      fs.unlinkSync(txtFilePath);
    });

    it('should enforce upload limits', async () => {
      const response = await request(app)
        .post('/upload-multiple')
        .attach('images', testImagePath)
        .attach('images', testImagePath)
        .attach('images', testImagePath)
        .attach('images', testImagePath)
        .attach('images', testImagePath)
        .attach('images', testImagePath); // 6th image exceeds limit

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('User Isolation', () => {
    it('should associate media with correct user', async () => {
      const response = await request(app)
        .post('/upload')
        .attach('image', testImagePath);

      expect(response.status).toBe(201);

      const mediaId = response.body.data.media.id;
      const media = await PostMedia.findByPk(mediaId);

      expect(media).toBeDefined();
      expect(media!.userId).toBe('test-user-id');
    });
  });

  describe('Concurrent Uploads', () => {
    it('should handle multiple concurrent uploads', async () => {
      const uploadPromises = [
        request(app).post('/upload').attach('image', testImagePath),
        request(app).post('/upload').attach('image', testImagePath),
        request(app).post('/upload').attach('image', testImagePath),
      ];

      const responses = await Promise.all(uploadPromises);

      responses.forEach((response) => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      // Verify all media were created
      const allMedia = await PostMedia.findAll();
      expect(allMedia.length).toBe(3);
    });
  });
});

