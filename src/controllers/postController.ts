import { Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { Post, User, PostRevision, Comment, Reaction, PostMedia } from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { getAnonymousDisplayName } from '../utils/anonymousAvatar.js';

export const createPost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.userId!;
    const {
      content,
      isAnonymous,
      postType,
      triggerWarnings,
      mood,
      imageUrls,
      audioUrl,
      isDraft,
      scheduledFor,
    } = req.body;

    const post = await Post.create({
      userId,
      content,
      isAnonymous: isAnonymous || false,
      postType,
      triggerWarnings: triggerWarnings || [],
      mood,
      imageUrls: imageUrls || [],
      audioUrl,
      isDraft: isDraft || false,
      scheduledFor: scheduledFor || null,
    });

    // Fetch the post with user data
    const createdPost = await Post.findByPk(post.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: [
            'id',
            'username',
            'displayName',
            'avatarUrl',
            'isVerifiedTherapist',
          ],
        },
      ],
    });

    // Transform for anonymous posts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const postData = createdPost!.toJSON() as any;
    if (postData.isAnonymous) {
      postData.user = {
        displayName: getAnonymousDisplayName(post.id),
        isAnonymous: true,
      };
    }

    // New posts have 0 comments and reactions
    postData.commentCount = 0;
    postData.reactionCount = 0;
    postData.hasUserReacted = false;

    res.status(201).json({
      message: 'Post created successfully',
      post: postData,
    });
  } catch (error) {
    next(error);
  }
};

export const getPosts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { mood, postType, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      deletedAt: null, // Exclude soft-deleted posts
      isDraft: false, // Exclude drafts
      [Op.or]: [
        { scheduledFor: null },
        { scheduledFor: { [Op.lte]: new Date() } }, // Only show scheduled posts that are due
      ],
    };
    if (mood) where.mood = mood;
    if (postType) where.postType = postType;

    const posts = await Post.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: [
            'id',
            'username',
            'displayName',
            'avatarUrl',
            'isVerifiedTherapist',
          ],
        },
        {
          model: PostMedia,
          as: 'media',
          where: { deletedAt: null },
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    // Transform posts to hide user info for anonymous posts and add counts
    const transformedPosts = await Promise.all(
      posts.rows.map(async (post) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const postData = post.toJSON() as any;
        if (postData.isAnonymous) {
          postData.user = {
            displayName: getAnonymousDisplayName(post.id),
            isAnonymous: true,
          };
        }

        // Get comment count
        const commentCount = await Comment.count({
          where: { postId: post.id, deletedAt: null },
        });

        // Get reaction count
        const reactionCount = await Reaction.count({
          where: { reactableType: 'post', reactableId: post.id },
        });

        postData.commentCount = commentCount;
        postData.reactionCount = reactionCount;

        // Check if current user has reacted (if authenticated)
        if (req.userId) {
          const userReaction = await Reaction.findOne({
            where: {
              userId: req.userId,
              reactableType: 'post',
              reactableId: post.id,
              reactionType: 'heart',
            },
          });
          postData.hasUserReacted = !!userReaction;
        } else {
          postData.hasUserReacted = false;
        }

        return postData;
      }),
    );

    res.json({
      posts: transformedPosts,
      total: posts.count,
      page: Number(page),
      totalPages: Math.ceil(posts.count / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
};

export const getPostById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    const post = await Post.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: [
            'id',
            'username',
            'displayName',
            'avatarUrl',
            'isVerifiedTherapist',
          ],
        },
        {
          model: PostMedia,
          as: 'media',
          where: { deletedAt: null },
          required: false,
        },
      ],
    });

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const postData = post.toJSON() as any;
    if (postData.isAnonymous) {
      postData.user = {
        displayName: getAnonymousDisplayName(post.id),
        isAnonymous: true,
      };
    }

    // Get comment count
    const commentCount = await Comment.count({
      where: { postId: post.id, deletedAt: null },
    });

    // Get reaction count
    const reactionCount = await Reaction.count({
      where: { reactableType: 'post', reactableId: post.id },
    });

    postData.commentCount = commentCount;
    postData.reactionCount = reactionCount;

    // Check if current user has reacted (if authenticated)
    if (req.userId) {
      const userReaction = await Reaction.findOne({
        where: {
          userId: req.userId,
          reactableType: 'post',
          reactableId: post.id,
          reactionType: 'heart',
        },
      });
      postData.hasUserReacted = !!userReaction;
    } else {
      postData.hasUserReacted = false;
    }

    res.json({ post: postData });
  } catch (error) {
    next(error);
  }
};

export const updatePost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { content, triggerWarnings, imageUrls, audioUrl, postType, mood } =
      req.body;

    const post = await Post.findByPk(id);

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    if (post.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    if (post.deletedAt) {
      throw new AppError('Cannot update deleted post', 400);
    }

    // Create revision before updating
    await PostRevision.create({
      postId: post.id,
      content: post.content,
      triggerWarnings: post.triggerWarnings,
      imageUrls: post.imageUrls || [],
      audioUrl: post.audioUrl || undefined,
      editedBy: userId,
    });

    // Update post
    await post.update({
      content: content || post.content,
      triggerWarnings: triggerWarnings || post.triggerWarnings,
      imageUrls: imageUrls || post.imageUrls,
      audioUrl: audioUrl !== undefined ? audioUrl : post.audioUrl,
      postType: postType || post.postType,
      mood: mood !== undefined ? mood : post.mood,
      isEdited: true,
      editedAt: new Date(),
    });

    res.json({
      message: 'Post updated successfully',
      post,
    });
  } catch (error) {
    next(error);
  }
};

export const deletePost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { permanent } = req.query;

    const post = await Post.findByPk(id);

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    if (post.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    if (permanent === 'true') {
      // Permanent delete
      await post.destroy();
      res.json({ message: 'Post permanently deleted' });
    } else {
      // Soft delete
      await post.update({ deletedAt: new Date() });
      res.json({ message: 'Post deleted successfully' });
    }
  } catch (error) {
    next(error);
  }
};
