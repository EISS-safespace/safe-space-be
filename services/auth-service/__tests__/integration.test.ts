import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import authRoutes from '../src/routes/authRoutes';
import { sequelize } from '../src/config/database';
import { User, Session, LoginAttempt } from '../src/models';

const app = express();
app.use(express.json());
app.use('/', authRoutes);

describe('Auth Service Integration Tests', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await User.destroy({ where: {}, truncate: true, cascade: true });
    await Session.destroy({ where: {}, truncate: true });
    await LoginAttempt.destroy({ where: {}, truncate: true });
  });

  describe('Complete User Flow', () => {
    it('should handle complete registration -> login -> validate flow', async () => {
      // Step 1: Register a new user
      const registerResponse = await request(app)
        .post('/register')
        .send({
          email: 'integration@test.com',
          username: 'integrationuser',
          password: 'SecurePass123',
          displayName: 'Integration Test User',
        });

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.data.user.email).toBe('integration@test.com');

      // Step 2: Login with the registered user
      const loginResponse = await request(app)
        .post('/login')
        .send({
          email: 'integration@test.com',
          password: 'SecurePass123',
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.accessToken).toBeDefined();
      expect(loginResponse.body.data.refreshToken).toBeDefined();

      const { accessToken } = loginResponse.body.data;

      // Step 3: Validate the token
      const validateResponse = await request(app)
        .get('/validate')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(validateResponse.status).toBe(200);
      expect(validateResponse.body.success).toBe(true);
      expect(validateResponse.body.data.user.email).toBe('integration@test.com');
    });

    it('should track multiple login attempts', async () => {
      // Register user
      await request(app)
        .post('/register')
        .send({
          email: 'attempts@test.com',
          username: 'attemptsuser',
          password: 'CorrectPass123',
          displayName: 'Attempts User',
        });

      // Failed login attempt 1
      await request(app)
        .post('/login')
        .send({
          email: 'attempts@test.com',
          password: 'WrongPass123',
        });

      // Failed login attempt 2
      await request(app)
        .post('/login')
        .send({
          email: 'attempts@test.com',
          password: 'WrongPass456',
        });

      // Check login attempts were recorded
      const attempts = await LoginAttempt.findAll({
        where: { email: 'attempts@test.com' },
      });

      expect(attempts.length).toBeGreaterThanOrEqual(2);

      // Successful login should work
      const successResponse = await request(app)
        .post('/login')
        .send({
          email: 'attempts@test.com',
          password: 'CorrectPass123',
        });

      expect(successResponse.status).toBe(200);
      expect(successResponse.body.success).toBe(true);
    });
  });

  describe('Session Management', () => {
    it('should create session on login', async () => {
      // Register and login
      await request(app)
        .post('/register')
        .send({
          email: 'session@test.com',
          username: 'sessionuser',
          password: 'SessionPass123',
          displayName: 'Session User',
        });

      const loginResponse = await request(app)
        .post('/login')
        .send({
          email: 'session@test.com',
          password: 'SessionPass123',
        });

      expect(loginResponse.status).toBe(200);

      // Check session was created
      const user = await User.findOne({ where: { email: 'session@test.com' } });
      const sessions = await Session.findAll({ where: { userId: user!.id } });

      expect(sessions.length).toBe(1);
      expect(sessions[0].isActive).toBe(true);
    });
  });

  describe('Password Security', () => {
    it('should hash passwords before storing', async () => {
      const password = 'PlainTextPass123';

      await request(app)
        .post('/register')
        .send({
          email: 'security@test.com',
          username: 'securityuser',
          password,
          displayName: 'Security User',
        });

      const user = await User.findOne({ where: { email: 'security@test.com' } });

      expect(user).toBeDefined();
      expect(user!.passwordHash).not.toBe(password);
      expect(user!.passwordHash.length).toBeGreaterThan(50); // bcrypt hash length
    });
  });

  describe('Email Uniqueness', () => {
    it('should prevent duplicate emails across multiple attempts', async () => {
      const userData = {
        email: 'duplicate@test.com',
        username: 'user1',
        password: 'Pass123',
        displayName: 'User 1',
      };

      // First registration
      const firstResponse = await request(app)
        .post('/register')
        .send(userData);

      expect(firstResponse.status).toBe(201);

      // Second registration with same email
      const secondResponse = await request(app)
        .post('/register')
        .send({
          ...userData,
          username: 'user2',
        });

      expect(secondResponse.status).toBe(400);
      expect(secondResponse.body.success).toBe(false);
    });
  });
});

