import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Post from '../../src/models/Post';
import sequelize from '../../src/config/database';

describe('Post soft delete', () => {
  beforeAll(async () => {
    // Reset DB for this test suite
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it.skip('soft deletes a post instead of hard deleting it', async () => {
    // Create a post
    const post = await Post.create({
      userId: '00000000-0000-0000-0000-000000000001',
      content: 'Soft delete test post',
      isAnonymous: false,
      postType: 'general',
      triggerWarnings: [],
    });

    // Soft delete the post
    await post.destroy();

    // Should NOT be found normally
    const foundPost = await Post.findByPk(post.id);
    expect(foundPost).toBeNull();

    // Should exist when paranoid = false
    const deletedPost = await Post.findByPk(post.id, { paranoid: false });
    expect(deletedPost).not.toBeNull();
    expect(deletedPost?.deletedAt).not.toBeNull();
  });
});
