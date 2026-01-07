import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { User, Session, VerificationToken, LoginAttempt } from '../models/index.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, verifyAccessToken } from '../utils/jwt.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email.js';
import { config } from '../config/index.js';
import { Op, Sequelize } from 'sequelize';

// Custom error class
export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Helper function to check for brute force attacks
const checkBruteForce = async (email: string, ipAddress: string): Promise<void> => {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  const emailAttempts = await LoginAttempt.count({
    where: { email, successful: false, createdAt: { [Op.gte]: fifteenMinutesAgo } },
  });

  const ipAttempts = await LoginAttempt.count({
    where: { ipAddress, successful: false, createdAt: { [Op.gte]: fifteenMinutesAgo } },
  });

  if (emailAttempts >= config.auth.maxLoginAttempts) {
    throw new AppError('Too many failed login attempts. Please try again later.', 429);
  }

  if (ipAttempts >= config.auth.maxLoginAttempts * 3) {
    throw new AppError('Too many failed login attempts from this IP. Please try again later.', 429);
  }
};

// Helper function to log login attempt
const logLoginAttempt = async (
  email: string,
  ipAddress: string,
  userAgent: string | undefined,
  successful: boolean,
  failureReason?: string,
): Promise<void> => {
  await LoginAttempt.create({ email, ipAddress, userAgent, successful, failureReason });
};

// Register new user
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, username, password, displayName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { [Op.or]: [{ email }, { username }] },
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

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await VerificationToken.create({
      userId: user.id,
      token: verificationToken,
      type: 'email_verification',
      expiresAt,
    });

    // Send verification email
    await sendVerificationEmail(user.email, verificationToken);

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Create session
    const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await Session.create({
      userId: user.id,
      refreshToken,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      expiresAt: sessionExpiresAt,
    });

    res.status(201).json({
      message: 'User registered successfully. Please check your email to verify your account.',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// Login user
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'];

    // Check for brute force
    await checkBruteForce(email, ipAddress);

    // Find user
    const user = await User.findOne({ where: { email } });

    if (!user) {
      await logLoginAttempt(email, ipAddress, userAgent, false, 'User not found');
      throw new AppError('Invalid credentials', 401);
    }

    // Check if account is locked
    if (user.accountLocked) {
      await logLoginAttempt(email, ipAddress, userAgent, false, 'Account locked');
      throw new AppError('Account is locked. Please contact support.', 403);
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      await logLoginAttempt(email, ipAddress, userAgent, false, 'Invalid password');

      // Increment failed login attempts
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.accountLocked = true;
        user.lockReason = 'Too many failed login attempts';
        user.lockedAt = new Date();
      }
      await user.save();

      throw new AppError('Invalid credentials', 401);
    }

    // Reset failed login attempts
    user.failedLoginAttempts = 0;
    user.lastLoginAt = new Date();
    user.lastLoginIp = ipAddress;
    await user.save();

    // Log successful login
    await logLoginAttempt(email, ipAddress, userAgent, true);

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Create session
    const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await Session.create({
      userId: user.id,
      refreshToken,
      ipAddress,
      userAgent,
      expiresAt: sessionExpiresAt,
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
        isVerifiedTherapist: user.isVerifiedTherapist,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// Verify email
export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.body;

    const verificationToken = await VerificationToken.findOne({
      where: Sequelize.and(
        { token },
        { type: 'email_verification' },
        Sequelize.where(Sequelize.col('usedAt'), 'IS', null),
        { expiresAt: { [Op.gt]: new Date() } }
      ),
    });

    if (!verificationToken) {
      throw new AppError('Invalid or expired verification token', 400);
    }

    const user = await User.findByPk(verificationToken.userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    await user.save();

    verificationToken.usedAt = new Date();
    await verificationToken.save();

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
};

// Refresh token
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      throw new AppError('Refresh token required', 400);
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(token);
    const userId = decoded.userId;

    // Find session
    const session = await Session.findOne({
      where: {
        refreshToken: token,
        userId,
        expiresAt: { [Op.gt]: new Date() },
      },
    });

    if (!session) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    // Generate new access token
    const accessToken = generateAccessToken(userId);

    res.json({ accessToken });
  } catch (error) {
    next(error);
  }
};

// Logout
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await Session.destroy({ where: { refreshToken } });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// Validate token (for other services)
export const validateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    const user = await User.findByPk(decoded.userId, {
      attributes: ['id', 'email', 'username', 'emailVerified', 'accountLocked'],
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.accountLocked) {
      throw new AppError('Account is locked', 403);
    }

    res.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

