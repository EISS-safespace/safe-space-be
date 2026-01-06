import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import routes from '../src/routes';
import { sequelize } from '../src/config/database';
import { Post, Comment, HopeStory, Quote, User } from '../src/models';

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
app.use(mockAuthMiddleware); // Mock authentication
app.use('/', routes);

describe('Content Service Tests', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
    
    // Create a test user
    await User.create({
      id: 'test-user-id',
      email: 'test@example.com',
      username: 'testuser',
      displayName: 'Test User',
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Post.destroy({ where: {}, truncate: true, cascade: true });
    await Comment.destroy({ where: {}, truncate: true });
    await HopeStory.destroy({ where: {}, truncate: true });
    await Quote.destroy({ where: {}, truncate: true });
  });

  describe('POST /posts', () => {
    it('should create a new post successfully', async () => {
      const response = await request(app)
        .post('/posts')
        .send({
          content: 'This is a test post',
          type: 'text',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.post).toBeDefined();
      expect(response.body.data.post.content).toBe('This is a test post');
      expect(response.body.data.post.userId).toBe('test-user-id');
    });

    it('should create an anonymous post', async () => {
      const response = await request(app)
        .post('/posts')
        .send({
          content: 'Anonymous post',
          type: 'text',
          isAnonymous: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.post.isAnonymous).toBe(true);
    });

    it('should create a post with trigger warnings', async () => {
      const response = await request(app)
        .post('/posts')
        .send({
          content: 'Post with trigger warning',
          type: 'text',
          triggerWarnings: ['anxiety', 'depression'],
        });

      expect(response.status).toBe(201);
      expect(response.body.data.post.triggerWarnings).toContain('anxiety');
      expect(response.body.data.post.triggerWarnings).toContain('depression');
    });

    it('should fail with empty content', async () => {
      const response = await request(app)
        .post('/posts')
        .send({
          content: '',
          type: 'text',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /posts', () => {
    beforeEach(async () => {
      // Create test posts
      await Post.bulkCreate([
        {
          id: 'post-1',
          userId: 'test-user-id',
          content: 'Post 1',
          type: 'text',
        },
        {
          id: 'post-2',
          userId: 'test-user-id',
          content: 'Post 2',
          type: 'text',
        },
        {
          id: 'post-3',
          userId: 'test-user-id',
          content: 'Post 3',
          type: 'text',
        },
      ]);
    });

    it('should get all posts', async () => {
      const response = await request(app).get('/posts');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toHaveLength(3);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/posts')
        .query({ page: 1, limit: 2 });

      expect(response.status).toBe(200);
      expect(response.body.data.posts).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.total).toBe(3);
    });

    it('should filter by type', async () => {
      await Post.create({
        id: 'post-4',
        userId: 'test-user-id',
        content: 'Image post',
        type: 'image',
      });

      const response = await request(app)
        .get('/posts')
        .query({ type: 'image' });

      expect(response.status).toBe(200);
      expect(response.body.data.posts).toHaveLength(1);
      expect(response.body.data.posts[0].type).toBe('image');
    });
  });

  describe('GET /posts/:id', () => {
    let postId: string;

    beforeEach(async () => {
      const post = await Post.create({
        userId: 'test-user-id',
        content: 'Test post',
        type: 'text',
      });
      postId = post.id;
    });

    it('should get a single post by id', async () => {
      const response = await request(app).get(`/posts/${postId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.post.id).toBe(postId);
    });

    it('should return 404 for non-existent post', async () => {
      const response = await request(app).get('/posts/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /posts/:id', () => {
    let postId: string;

    beforeEach(async () => {
      const post = await Post.create({
        userId: 'test-user-id',
        content: 'Original content',
        type: 'text',
      });
      postId = post.id;
    });

    it('should update a post', async () => {
      const response = await request(app)
        .put(`/posts/${postId}`)
        .send({
          content: 'Updated content',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.post.content).toBe('Updated content');
      expect(response.body.data.post.isEdited).toBe(true);
    });

    it('should fail to update non-existent post', async () => {
      const response = await request(app)
        .put('/posts/non-existent-id')
        .send({
          content: 'Updated content',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /posts/:id', () => {
    let postId: string;

    beforeEach(async () => {
      const post = await Post.create({
        userId: 'test-user-id',
        content: 'Post to delete',
        type: 'text',
      });
      postId = post.id;
    });

    it('should delete a post', async () => {
      const response = await request(app).delete(`/posts/${postId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify post is deleted
      const post = await Post.findByPk(postId);
      expect(post).toBeNull();
    });

    it('should fail to delete non-existent post', async () => {
      const response = await request(app).delete('/posts/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Hope Wall Tests', () => {
    describe('POST /hope-wall/stories', () => {
      it('should create a hope story', async () => {
        const response = await request(app)
          .post('/hope-wall/stories')
          .send({
            title: 'My Recovery Story',
            content: 'This is my story of hope and recovery',
            isAnonymous: false,
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.story.title).toBe('My Recovery Story');
      });

      it('should create an anonymous hope story', async () => {
        const response = await request(app)
          .post('/hope-wall/stories')
          .send({
            title: 'Anonymous Story',
            content: 'Anonymous recovery story',
            isAnonymous: true,
          });

        expect(response.status).toBe(201);
        expect(response.body.data.story.isAnonymous).toBe(true);
      });
    });

    describe('GET /hope-wall/stories', () => {
      beforeEach(async () => {
        await HopeStory.bulkCreate([
          {
            userId: 'test-user-id',
            title: 'Story 1',
            content: 'Content 1',
            isApproved: true,
          },
          {
            userId: 'test-user-id',
            title: 'Story 2',
            content: 'Content 2',
            isApproved: true,
          },
        ]);
      });

      it('should get all approved hope stories', async () => {
        const response = await request(app).get('/hope-wall/stories');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.stories).toHaveLength(2);
      });
    });

    describe('POST /hope-wall/quotes', () => {
      it('should create a quote', async () => {
        const response = await request(app)
          .post('/hope-wall/quotes')
          .send({
            text: 'Every day is a new beginning',
            author: 'Anonymous',
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.quote.text).toBe('Every day is a new beginning');
      });
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.service).toBe('content-service');
    });
  });
});

