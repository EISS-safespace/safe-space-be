/**
 * Test Helper Utilities for Auth Service
 * Provides reusable functions for testing
 */

import { User, Session, LoginAttempt, VerificationToken } from '../../src/models';

/**
 * Create a test user with default or custom data
 */
export async function createTestUser(overrides: Partial<any> = {}) {
  const defaultUser = {
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', // Mock hash
    displayName: 'Test User',
    isEmailVerified: true,
    ...overrides,
  };

  return await User.create(defaultUser);
}

/**
 * Create multiple test users
 */
export async function createTestUsers(count: number) {
  const users = [];
  for (let i = 1; i <= count; i++) {
    const user = await createTestUser({
      email: `user${i}@example.com`,
      username: `user${i}`,
      displayName: `User ${i}`,
    });
    users.push(user);
  }
  return users;
}

/**
 * Create a test session for a user
 */
export async function createTestSession(userId: string, overrides: Partial<any> = {}) {
  const defaultSession = {
    userId,
    refreshToken: 'mock-refresh-token',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    isActive: true,
    ...overrides,
  };

  return await Session.create(defaultSession);
}

/**
 * Create test login attempts
 */
export async function createLoginAttempts(email: string, count: number, successful = false) {
  const attempts = [];
  for (let i = 0; i < count; i++) {
    const attempt = await LoginAttempt.create({
      email,
      ipAddress: '127.0.0.1',
      userAgent: 'Test Agent',
      successful,
      attemptedAt: new Date(),
    });
    attempts.push(attempt);
  }
  return attempts;
}

/**
 * Create a verification token
 */
export async function createVerificationToken(userId: string, overrides: Partial<any> = {}) {
  const defaultToken = {
    userId,
    token: 'mock-verification-token',
    type: 'email_verification',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    ...overrides,
  };

  return await VerificationToken.create(defaultToken);
}

/**
 * Clean up all test data
 */
export async function cleanupTestData() {
  await User.destroy({ where: {}, truncate: true, cascade: true });
  await Session.destroy({ where: {}, truncate: true });
  await LoginAttempt.destroy({ where: {}, truncate: true });
  await VerificationToken.destroy({ where: {}, truncate: true });
}

/**
 * Generate mock JWT token for testing
 */
export function generateMockToken(payload: any = {}) {
  const defaultPayload = {
    userId: 'test-user-id',
    email: 'test@example.com',
    ...payload,
  };

  // Simple mock token (not a real JWT)
  return `mock.${Buffer.from(JSON.stringify(defaultPayload)).toString('base64')}.signature`;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

/**
 * Wait for a specified time (useful for rate limiting tests)
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate random email
 */
export function randomEmail(): string {
  return `test-${Math.random().toString(36).substring(7)}@example.com`;
}

/**
 * Generate random username
 */
export function randomUsername(): string {
  return `user-${Math.random().toString(36).substring(7)}`;
}

