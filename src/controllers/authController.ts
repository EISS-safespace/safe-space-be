import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import {
  User,
  Session,
  UserProfile,
  UserSettings,
  TrustScore,
  VerificationToken,
  LoginAttempt,
} from '../models/index.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from '../utils/email.js';
import { AppError } from '../middleware/errorHandler.js';
import { config } from '../config/index.js';
import { AuthRequest } from '../middleware/auth.js';
import { Op } from 'sequelize';

/**
 * Helper function to check for brute force attacks
 */
const checkBruteForce = async (
  email: string,
  ipAddress: string,
): Promise<void> => {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  // Check failed attempts by email
  const emailAttempts = await LoginAttempt.count({
    where: {
      email,
      successful: false,
      createdAt: { [Op.gte]: fifteenMinutesAgo },
    },
  });

  // Check failed attempts by IP
  const ipAttempts = await LoginAttempt.count({
    where: {
      ipAddress,
      successful: false,
      createdAt: { [Op.gte]: fifteenMinutesAgo },
    },
  });

  if (emailAttempts >= config.auth.maxLoginAttempts) {
    throw new AppError(
      'Too many failed login attempts. Please try again later.',
      429,
    );
  }

  if (ipAttempts >= config.auth.maxLoginAttempts * 3) {
    throw new AppError(
      'Too many failed login attempts from this IP. Please try again later.',
      429,
    );
  }
};

/**
 * Helper function to log login attempt
 */
const logLoginAttempt = async (
  email: string,
  ipAddress: string,
  userAgent: string | undefined,
  successful: boolean,
  failureReason?: string,
): Promise<void> => {
  await LoginAttempt.create({
    email,
    ipAddress,
    userAgent,
    successful,
    failureReason,
  });
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, username, password, displayName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new AppError('Email already in use', 400);
      }
      throw new AppError('Username already taken', 400);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await User.create({
      email,
      username,
      passwordHash,
      displayName,
      isVerifiedTherapist: false,
      allowAnonymous: true,
      emailVerified: false,
      phoneVerified: false,
      accountLocked: false,
      failedLoginAttempts: 0,
    });

    // Create user profile
    await UserProfile.create({
      userId: user.id,
    });

    // Create user settings with defaults
    await UserSettings.create({
      userId: user.id,
    });

    // Create initial trust score
    await TrustScore.create({
      userId: user.id,
      score: 50,
      postsCount: 0,
      helpfulReactionsReceived: 0,
      reportsReceived: 0,
      accountAge: 0,
      verifiedEmail: false,
      verifiedPhone: false,
      lastCalculatedAt: new Date(),
    });

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(
      Date.now() + config.auth.verificationTokenExpiry,
    );

    await VerificationToken.create({
      userId: user.id,
      token: verificationToken,
      type: 'email_verification',
      expiresAt,
    });

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    res.status(201).json({
      message:
        'User created successfully. Please check your email to verify your account.',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'];

    // Check for brute force attacks
    await checkBruteForce(email, ipAddress);

    // Find user
    const user = await User.findOne({ where: { email } });

    if (!user) {
      await logLoginAttempt(
        email,
        ipAddress,
        userAgent,
        false,
        'User not found',
      );
      throw new AppError('Invalid credentials', 401);
    }

    // Check if account is locked
    if (user.accountLocked) {
      await logLoginAttempt(
        email,
        ipAddress,
        userAgent,
        false,
        'Account locked',
      );
      throw new AppError(
        `Account is locked. Reason: ${user.lockReason || 'Security reasons'}`,
        403,
      );
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      // Increment failed login attempts
      user.failedLoginAttempts += 1;

      // Lock account if too many failed attempts
      if (user.failedLoginAttempts >= config.auth.maxLoginAttempts) {
        user.accountLocked = true;
        user.lockReason = 'Too many failed login attempts';
        user.lockedAt = new Date();
      }

      await user.save();
      await logLoginAttempt(
        email,
        ipAddress,
        userAgent,
        false,
        'Invalid password',
      );
      throw new AppError('Invalid credentials', 401);
    }

    // Reset failed login attempts on successful login
    user.failedLoginAttempts = 0;
    user.lastLoginAt = new Date();
    user.lastLoginIp = ipAddress;
    await user.save();

    // Log successful login
    await logLoginAttempt(email, ipAddress, userAgent, true);

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token in database
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await Session.create({
      userId: user.id,
      refreshToken,
      deviceInfo: userAgent,
      ipAddress,
      userAgent,
      expiresAt,
    });

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      message: 'Login successful',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const refreshToken =
      req.cookies.refreshToken || req.body.refreshToken || req.headers['x-refresh-token'];

    if (refreshToken) {
      // Delete session from database
      await Session.destroy({ where: { refreshToken } });
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.json({ message: 'Logout successful' });
  } catch (error) {
    next(error);
  }
};

export const refreshAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const refreshToken =
      req.cookies.refreshToken || req.body.refreshToken || req.headers['x-refresh-token'];

    if (!refreshToken) {
      throw new AppError('Refresh token not provided', 401);
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Check if session exists in database
    const session = await Session.findOne({ where: { refreshToken } });

    if (!session) {
      throw new AppError('Invalid refresh token', 401);
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      await session.destroy();
      throw new AppError('Refresh token expired', 401);
    }

    // Generate new access token
    const accessToken = generateAccessToken(payload.userId);

    res.json({
      message: 'Token refreshed successfully',
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      throw new AppError('Verification token is required', 400);
    }

    // Find verification token
    const verificationToken = await VerificationToken.findOne({
      where: {
        token,
        type: 'email_verification',
        usedAt: null,
      },
    });

    if (!verificationToken) {
      throw new AppError('Invalid or expired verification token', 400);
    }

    // Check if token is expired
    if (verificationToken.expiresAt < new Date()) {
      throw new AppError('Verification token has expired', 400);
    }

    // Update user
    const user = await User.findByPk(verificationToken.userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    await user.save();

    // Mark token as used
    verificationToken.usedAt = new Date();
    await verificationToken.save();

    // Update trust score
    const trustScore = await TrustScore.findOne({
      where: { userId: user.id },
    });
    if (trustScore) {
      trustScore.verifiedEmail = true;
      await trustScore.save();
    }

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
};

export const resendVerificationEmail = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if user exists
      res.json({ message: 'If the email exists, a verification link has been sent.' });
      return;
    }

    if (user.emailVerified) {
      throw new AppError('Email is already verified', 400);
    }

    // Invalidate old tokens
    await VerificationToken.update(
      { usedAt: new Date() },
      {
        where: {
          userId: user.id,
          type: 'email_verification',
          usedAt: null,
        },
      },
    );

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(
      Date.now() + config.auth.verificationTokenExpiry,
    );

    await VerificationToken.create({
      userId: user.id,
      token: verificationToken,
      type: 'email_verification',
      expiresAt,
    });

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    res.json({ message: 'Verification email sent successfully' });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if user exists
      res.json({
        message: 'If the email exists, a password reset link has been sent.',
      });
      return;
    }

    // Invalidate old password reset tokens
    await VerificationToken.update(
      { usedAt: new Date() },
      {
        where: {
          userId: user.id,
          type: 'password_reset',
          usedAt: null,
        },
      },
    );

    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(
      Date.now() + config.auth.passwordResetTokenExpiry,
    );

    await VerificationToken.create({
      userId: user.id,
      token: resetToken,
      type: 'password_reset',
      expiresAt,
    });

    // Send password reset email
    await sendPasswordResetEmail(email, resetToken);

    res.json({
      message: 'If the email exists, a password reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      throw new AppError('Token and new password are required', 400);
    }

    // Find password reset token
    const resetToken = await VerificationToken.findOne({
      where: {
        token,
        type: 'password_reset',
        usedAt: null,
      },
    });

    if (!resetToken) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // Check if token is expired
    if (resetToken.expiresAt < new Date()) {
      throw new AppError('Reset token has expired', 400);
    }

    // Update user password
    const user = await User.findByPk(resetToken.userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const passwordHash = await hashPassword(newPassword);
    user.passwordHash = passwordHash;
    user.failedLoginAttempts = 0;
    user.accountLocked = false;
    user.lockReason = null;
    user.lockedAt = null;
    await user.save();

    // Mark token as used
    resetToken.usedAt = new Date();
    await resetToken.save();

    // Invalidate all sessions (force re-login)
    await Session.destroy({ where: { userId: user.id } });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    if (!currentPassword || !newPassword) {
      throw new AppError('Current and new password are required', 400);
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isPasswordValid = await comparePassword(
      currentPassword,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Update password
    const passwordHash = await hashPassword(newPassword);
    user.passwordHash = passwordHash;
    await user.save();

    // Invalidate all sessions except current one
    const currentRefreshToken = req.cookies.refreshToken;
    await Session.destroy({
      where: {
        userId: user.id,
        refreshToken: { [Op.ne]: currentRefreshToken },
      },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['passwordHash'] },
      include: [
        { model: UserProfile, as: 'profile' },
        { model: UserSettings, as: 'settings' },
        { model: TrustScore, as: 'trustScore' },
      ],
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};
