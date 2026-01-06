import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import routes from '../src/routes';
import { sequelize } from '../src/config/database';
import { Post, HopeStory, Quote, Comment, Reaction } from '../src/models';

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

describe('Content Service Integration Tests', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Post.destroy({ where: {}, truncate: true, cascade: true });
    await HopeStory.destroy({ where: {}, truncate: true });
    await Quote.destroy({ where: {}, truncate: true });
    await Comment.destroy({ where: {}, truncate: true });
    await Reaction.destroy({ where: {}, truncate: true });
  });

  describe('Post Lifecycle', () => {
    it('should handle complete post lifecycle: create -> read -> update -> delete', async () => {
      // Create post
      const createResponse = await request(app)
        .post('/posts')
        .send({
          content: 'Original content',
          type: 'text',
          isAnonymous: false,
        });

      expect(createResponse.status).toBe(201);
      const postId = createResponse.body.data.post.id;

      // Read post
      const readResponse = await request(app).get(`/posts/${postId}`);
      expect(readResponse.status).toBe(200);
      expect(readResponse.body.data.post.content).toBe('Original content');

      // Update post
      const updateResponse = await request(app)
        .put(`/posts/${postId}`)
        .send({
          content: 'Updated content',
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.post.content).toBe('Updated content');

      // Delete post
      const deleteResponse = await request(app).delete(`/posts/${postId}`);
      expect(deleteResponse.status).toBe(200);

      // Verify deletion
      const verifyResponse = await request(app).get(`/posts/${postId}`);
      expect(verifyResponse.status).toBe(404);
    });
  });

  describe('Post with Trigger Warnings', () => {
    it('should create and retrieve posts with multiple trigger warnings', async () => {
      const response = await request(app)
        .post('/posts')
        .send({
          content: 'Sensitive content',
          type: 'text',
          isAnonymous: false,
          triggerWarnings: ['anxiety', 'depression', 'trauma'],
        });

      expect(response.status).toBe(201);
      expect(response.body.data.post.triggerWarnings).toEqual([
        'anxiety',
        'depression',
        'trauma',
      ]);
    });
  });

  describe('Anonymous vs Non-Anonymous Posts', () => {
    it('should handle both anonymous and non-anonymous posts', async () => {
      // Create anonymous post
      const anonResponse = await request(app)
        .post('/posts')
        .send({
          content: 'Anonymous post',
          type: 'text',
          isAnonymous: true,
        });

      expect(anonResponse.status).toBe(201);
      expect(anonResponse.body.data.post.isAnonymous).toBe(true);

      // Create non-anonymous post
      const publicResponse = await request(app)
        .post('/posts')
        .send({
          content: 'Public post',
          type: 'text',
          isAnonymous: false,
        });

      expect(publicResponse.status).toBe(201);
      expect(publicResponse.body.data.post.isAnonymous).toBe(false);

      // Get all posts
      const allPosts = await request(app).get('/posts');
      expect(allPosts.body.data.posts.length).toBe(2);
    });
  });

  describe('Hope Wall Integration', () => {
    it('should create and retrieve hope stories and quotes', async () => {
      // Create hope story
      const storyResponse = await request(app)
        .post('/hope-wall/stories')
        .send({
          title: 'My Recovery Journey',
          content: 'This is my story of hope',
          isAnonymous: false,
        });

      expect(storyResponse.status).toBe(201);

      // Create quote
      const quoteResponse = await request(app)
        .post('/hope-wall/quotes')
        .send({
          text: 'Every day is a new beginning',
          author: 'Anonymous',
        });

      expect(quoteResponse.status).toBe(201);

      // Get stories
      const storiesResponse = await request(app).get('/hope-wall/stories');
      expect(storiesResponse.status).toBe(200);

      // Get quotes
      const quotesResponse = await request(app).get('/hope-wall/quotes');
      expect(quotesResponse.status).toBe(200);
    });
  });

  describe('Pagination and Filtering', () => {
    it('should paginate posts correctly', async () => {
      // Create 15 posts
      for (let i = 1; i <= 15; i++) {
        await request(app)
          .post('/posts')
          .send({
            content: `Post ${i}`,
            type: 'text',
            isAnonymous: false,
          });
      }

      // Get first page (default 10 items)
      const page1 = await request(app).get('/posts?page=1&limit=10');
      expect(page1.body.data.posts.length).toBe(10);
      expect(page1.body.data.pagination.total).toBe(15);
      expect(page1.body.data.pagination.pages).toBe(2);

      // Get second page
      const page2 = await request(app).get('/posts?page=2&limit=10');
      expect(page2.body.data.posts.length).toBe(5);
    });

    it('should filter posts by type', async () => {
      // Create different types of posts
      await request(app).post('/posts').send({
        content: 'Text post',
        type: 'text',
        isAnonymous: false,
      });

      await request(app).post('/posts').send({
        content: 'Image post',
        type: 'image',
        isAnonymous: false,
      });

      // Filter by type
      const textPosts = await request(app).get('/posts?type=text');
      expect(textPosts.body.data.posts.length).toBe(1);
      expect(textPosts.body.data.posts[0].type).toBe('text');
    });
  });
});

