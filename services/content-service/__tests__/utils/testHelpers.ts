/**
 * Test Helper Utilities for Content Service
 * Provides reusable functions for testing
 */

import { Post, HopeStory, Quote, Comment, Reaction } from '../../src/models';

/**
 * Create a test post with default or custom data
 */
export async function createTestPost(overrides: Partial<any> = {}) {
  const defaultPost = {
    userId: 'test-user-id',
    content: 'Test post content',
    type: 'text',
    isAnonymous: false,
    ...overrides,
  };

  return await Post.create(defaultPost);
}

/**
 * Create multiple test posts
 */
export async function createTestPosts(count: number, overrides: Partial<any> = {}) {
  const posts = [];
  for (let i = 1; i <= count; i++) {
    const post = await createTestPost({
      content: `Test post ${i}`,
      ...overrides,
    });
    posts.push(post);
  }
  return posts;
}

/**
 * Create a test hope story
 */
export async function createTestHopeStory(overrides: Partial<any> = {}) {
  const defaultStory = {
    userId: 'test-user-id',
    title: 'Test Hope Story',
    content: 'This is a test hope story',
    isAnonymous: false,
    isApproved: true,
    ...overrides,
  };

  return await HopeStory.create(defaultStory);
}

/**
 * Create a test quote
 */
export async function createTestQuote(overrides: Partial<any> = {}) {
  const defaultQuote = {
    text: 'Test inspirational quote',
    author: 'Test Author',
    isActive: true,
    ...overrides,
  };

  return await Quote.create(defaultQuote);
}

/**
 * Create a test comment
 */
export async function createTestComment(postId: string, overrides: Partial<any> = {}) {
  const defaultComment = {
    postId,
    userId: 'test-user-id',
    content: 'Test comment',
    isAnonymous: false,
    ...overrides,
  };

  return await Comment.create(defaultComment);
}

/**
 * Create a test reaction
 */
export async function createTestReaction(postId: string, overrides: Partial<any> = {}) {
  const defaultReaction = {
    postId,
    userId: 'test-user-id',
    type: 'heart',
    ...overrides,
  };

  return await Reaction.create(defaultReaction);
}

/**
 * Clean up all test data
 */
export async function cleanupTestData() {
  await Post.destroy({ where: {}, truncate: true, cascade: true });
  await HopeStory.destroy({ where: {}, truncate: true });
  await Quote.destroy({ where: {}, truncate: true });
  await Comment.destroy({ where: {}, truncate: true });
  await Reaction.destroy({ where: {}, truncate: true });
}

/**
 * Create mock user context for testing
 */
export function createMockUser(overrides: Partial<any> = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    username: 'testuser',
    ...overrides,
  };
}

/**
 * Create mock request object
 */
export function createMockRequest(overrides: Partial<any> = {}) {
  return {
    user: createMockUser(),
    body: {},
    params: {},
    query: {},
    ...overrides,
  };
}

/**
 * Create mock response object
 */
export function createMockResponse() {
  const res: any = {};
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data: any) => {
    res.data = data;
    return res;
  };
  return res;
}

/**
 * Generate random content
 */
export function randomContent(length = 50): string {
  const words = [
    'mental',
    'health',
    'support',
    'community',
    'hope',
    'recovery',
    'wellness',
    'journey',
    'strength',
    'resilience',
  ];
  let content = '';
  for (let i = 0; i < length; i++) {
    content += words[Math.floor(Math.random() * words.length)] + ' ';
  }
  return content.trim();
}

/**
 * Validate trigger warnings
 */
export function isValidTriggerWarning(warning: string): boolean {
  const validWarnings = [
    'anxiety',
    'depression',
    'trauma',
    'self-harm',
    'suicide',
    'eating-disorder',
    'substance-abuse',
  ];
  return validWarnings.includes(warning);
}

