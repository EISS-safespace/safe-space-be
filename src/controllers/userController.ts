import { Response, NextFunction } from 'express';
import {
  User,
  UserProfile,
  Post,
  TrustScore,
  PostMedia,
  Comment,
  Reaction,
} from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../middleware/auth.js';
import { uploadFile } from '../services/mediaStorage.js';
import { processImage } from '../services/imageProcessing.js';

export const getUserProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { username } = req.params;
    const currentUserId = req.userId;

    const user = await User.findOne({
      where: { username },
      attributes: {
        exclude: ['passwordHash', 'failedLoginAttempts', 'lastFailedLogin'],
      },
      include: [
        { model: UserProfile, as: 'profile' },
        { model: TrustScore, as: 'trustScore' },
      ],
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Get user's posts with full data (same as getPosts)
    const posts = await Post.findAll({
      where: {
        userId: user.id,
        deletedAt: null,
        isDraft: false,
      },
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
      limit: 20,
    });

    // Transform posts to add counts and hasUserReacted
    const transformedPosts = await Promise.all(
      posts.map(async (post) => {
        const postData = post.toJSON();

        // Get comment count
        const commentCount = await Comment.count({
          where: {
            postId: post.id,
            deletedAt: null,
          },
        });

        // Get reaction count
        const reactionCount = await Reaction.count({
          where: {
            reactableType: 'post',
            reactableId: post.id,
          },
        });

        // Check if current user has reacted
        let hasUserReacted = false;
        if (currentUserId) {
          const userReaction = await Reaction.findOne({
            where: {
              reactableType: 'post',
              reactableId: post.id,
              userId: currentUserId,
              reactionType: 'heart',
            },
          });
          hasUserReacted = !!userReaction;
        }

        return {
          ...postData,
          commentCount,
          reactionCount,
          hasUserReacted,
        };
      }),
    );

    // Check if viewing own profile
    const isOwnProfile = currentUserId === user.id;

    res.json({
      user,
      posts: transformedPosts,
      isOwnProfile,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { displayName, bio, avatarUrl, coverPhotoUrl } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Update user basic info
    await user.update({
      displayName: displayName !== undefined ? displayName : user.displayName,
      bio: bio !== undefined ? bio : user.bio,
      avatarUrl: avatarUrl !== undefined ? avatarUrl : user.avatarUrl,
      coverPhotoUrl:
        coverPhotoUrl !== undefined ? coverPhotoUrl : user.coverPhotoUrl,
    });

    // Update or create user profile
    let profile = await UserProfile.findOne({ where: { userId } });
    if (!profile) {
      profile = await UserProfile.create({ userId });
    }

    res.json({
      message: 'Profile updated successfully',
      user,
      profile,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfileDetails = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { interests, location, website, socialLinks, pronouns } = req.body;

    let profile = await UserProfile.findOne({ where: { userId } });
    if (!profile) {
      profile = await UserProfile.create({ userId });
    }

    await profile.update({
      interests: interests !== undefined ? interests : profile.interests,
      location: location !== undefined ? location : profile.location,
      website: website !== undefined ? website : profile.website,
      socialLinks:
        socialLinks !== undefined ? socialLinks : profile.socialLinks,
      pronouns: pronouns !== undefined ? pronouns : profile.pronouns,
    });

    res.json({
      message: 'Profile details updated successfully',
      profile,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserPosts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const user = await User.findOne({ where: { username } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const posts = await Post.findAndCountAll({
      where: {
        userId: user.id,
        deletedAt: null,
        isDraft: false,
      },
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      posts: posts.rows,
      total: posts.count,
      page: Number(page),
      totalPages: Math.ceil(posts.count / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
};

export const uploadAvatar = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.userId!;
    const file = req.file as Express.Multer.File;

    if (!file) {
      throw new AppError('No file uploaded', 400);
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Process image (compress, generate thumbnail)
    const processed = await processImage(file.path);

    // Upload to storage
    const uploadResult = await uploadFile(
      processed.originalPath,
      file.filename,
      'avatars',
    );

    // Update user avatar URL
    await user.update({ avatarUrl: uploadResult.url });

    res.json({
      message: 'Avatar uploaded successfully',
      avatarUrl: uploadResult.url,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadCoverPhoto = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.userId!;
    const file = req.file as Express.Multer.File;

    if (!file) {
      throw new AppError('No file uploaded', 400);
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Process image (compress, generate thumbnail)
    const processed = await processImage(file.path);

    // Upload to storage
    const uploadResult = await uploadFile(
      processed.originalPath,
      file.filename,
      'covers',
    );

    // Update user cover photo URL
    await user.update({ coverPhotoUrl: uploadResult.url });

    res.json({
      message: 'Cover photo uploaded successfully',
      coverPhotoUrl: uploadResult.url,
    });
  } catch (error) {
    next(error);
  }
};
