import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import authRoutes from '../src/routes/authRoutes';
import { sequelize } from '../src/config/database';
import { User, Session, LoginAttempt, VerificationToken } from '../src/models';

// Create test app
const app = express();
app.use(express.json());
app.use('/', authRoutes);

describe('Auth Service Tests', () => {
  beforeAll(async () => {
    // Connect to test database
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await User.destroy({ where: {}, truncate: true, cascade: true });
    await Session.destroy({ where: {}, truncate: true });
    await LoginAttempt.destroy({ where: {}, truncate: true });
    await VerificationToken.destroy({ where: {}, truncate: true });
  });

  describe('POST /register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'Test1234',
          displayName: 'Test User',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.user.username).toBe('testuser');
      expect(response.body.data.user.password).toBeUndefined(); // Password should not be returned
    });

    it('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/register')
        .send({
          email: 'invalid-email',
          username: 'testuser',
          password: 'Test1234',
          displayName: 'Test User',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with weak password', async () => {
      const response = await request(app)
        .post('/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'weak',
          displayName: 'Test User',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with duplicate email', async () => {
      // Create first user
      await request(app).post('/register').send({
        email: 'test@example.com',
        username: 'testuser1',
        password: 'Test1234',
        displayName: 'Test User 1',
      });

      // Try to create second user with same email
      const response = await request(app)
        .post('/register')
        .send({
          email: 'test@example.com',
          username: 'testuser2',
          password: 'Test1234',
          displayName: 'Test User 2',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with duplicate username', async () => {
      // Create first user
      await request(app).post('/register').send({
        email: 'test1@example.com',
        username: 'testuser',
        password: 'Test1234',
        displayName: 'Test User 1',
      });

      // Try to create second user with same username
      const response = await request(app)
        .post('/register')
        .send({
          email: 'test2@example.com',
          username: 'testuser',
          password: 'Test1234',
          displayName: 'Test User 2',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /login', () => {
    beforeEach(async () => {
      // Create a test user
      await request(app).post('/register').send({
        email: 'test@example.com',
        username: 'testuser',
        password: 'Test1234',
        displayName: 'Test User',
      });

      // Verify the user manually for testing
      await User.update({ emailVerified: true }, { where: { email: 'test@example.com' } });
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: 'Test1234',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user).toBeDefined();
    });

    it('should fail with incorrect password', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test1234',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should track login attempts', async () => {
      // Make a failed login attempt
      await request(app).post('/login').send({
        email: 'test@example.com',
        password: 'WrongPassword',
      });

      // Check that login attempt was recorded
      const attempts = await LoginAttempt.findAll({
        where: { email: 'test@example.com' },
      });

      expect(attempts.length).toBeGreaterThan(0);
    });
  });

  describe('GET /validate', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Create and login a user
      await request(app).post('/register').send({
        email: 'test@example.com',
        username: 'testuser',
        password: 'Test1234',
        displayName: 'Test User',
      });

      await User.update({ emailVerified: true }, { where: { email: 'test@example.com' } });

      const loginResponse = await request(app).post('/login').send({
        email: 'test@example.com',
        password: 'Test1234',
      });

      accessToken = loginResponse.body.data.accessToken;
    });

    it('should validate a valid token', async () => {
      const response = await request(app)
        .get('/validate')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/validate')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail without token', async () => {
      const response = await request(app).get('/validate');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.service).toBe('auth-service');
    });
  });
});

