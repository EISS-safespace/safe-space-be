import { TrustScore, User } from '../models/index.js';

interface TrustScoreFactors {
  postsCount: number;
  helpfulReactionsReceived: number;
  reportsReceived: number;
  accountAge: number; // in days
  verifiedEmail: boolean;
  verifiedPhone: boolean;
}

/**
 * Calculate trust score based on various factors
 * Score ranges from 0 to 100
 */
export const calculateTrustScore = (factors: TrustScoreFactors): number => {
  let score = 50; // Base score

  // Account age contribution (max +15 points)
  // 1 point per 7 days, capped at 15 points (105 days)
  const ageScore = Math.min(15, Math.floor(factors.accountAge / 7));
  score += ageScore;

  // Posts contribution (max +10 points)
  // 1 point per 5 posts, capped at 10 points (50 posts)
  const postsScore = Math.min(10, Math.floor(factors.postsCount / 5));
  score += postsScore;

  // Helpful reactions contribution (max +15 points)
  // 1 point per 3 helpful reactions, capped at 15 points (45 reactions)
  const reactionsScore = Math.min(
    15,
    Math.floor(factors.helpfulReactionsReceived / 3),
  );
  score += reactionsScore;

  // Email verification (+5 points)
  if (factors.verifiedEmail) {
    score += 5;
  }

  // Phone verification (+5 points)
  if (factors.verifiedPhone) {
    score += 5;
  }

  // Reports penalty (-10 points per report)
  const reportsScore = factors.reportsReceived * 10;
  score -= reportsScore;

  // Ensure score is within 0-100 range
  return Math.max(0, Math.min(100, score));
};

/**
 * Update trust score for a user
 */
export const updateUserTrustScore = async (userId: string): Promise<number> => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Calculate account age in days
  const accountAge = Math.floor(
    (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24),
  );

  // Get or create trust score record
  let trustScore = await TrustScore.findOne({ where: { userId } });

  if (!trustScore) {
    trustScore = await TrustScore.create({
      userId,
      score: 50,
      postsCount: 0,
      helpfulReactionsReceived: 0,
      reportsReceived: 0,
      accountAge,
      verifiedEmail: user.emailVerified,
      verifiedPhone: user.phoneVerified,
      lastCalculatedAt: new Date(),
    });
  }

  // Update factors
  trustScore.accountAge = accountAge;
  trustScore.verifiedEmail = user.emailVerified;
  trustScore.verifiedPhone = user.phoneVerified;

  // Calculate new score
  const newScore = calculateTrustScore({
    postsCount: trustScore.postsCount,
    helpfulReactionsReceived: trustScore.helpfulReactionsReceived,
    reportsReceived: trustScore.reportsReceived,
    accountAge: trustScore.accountAge,
    verifiedEmail: trustScore.verifiedEmail,
    verifiedPhone: trustScore.verifiedPhone,
  });

  trustScore.score = newScore;
  trustScore.lastCalculatedAt = new Date();
  await trustScore.save();

  return newScore;
};

/**
 * Increment post count and recalculate trust score
 */
export const incrementPostCount = async (userId: string): Promise<void> => {
  const trustScore = await TrustScore.findOne({ where: { userId } });
  if (trustScore) {
    trustScore.postsCount += 1;
    await trustScore.save();
    await updateUserTrustScore(userId);
  }
};

/**
 * Increment helpful reactions count and recalculate trust score
 */
export const incrementHelpfulReactions = async (
  userId: string,
): Promise<void> => {
  const trustScore = await TrustScore.findOne({ where: { userId } });
  if (trustScore) {
    trustScore.helpfulReactionsReceived += 1;
    await trustScore.save();
    await updateUserTrustScore(userId);
  }
};

/**
 * Increment reports count and recalculate trust score
 */
export const incrementReports = async (userId: string): Promise<void> => {
  const trustScore = await TrustScore.findOne({ where: { userId } });
  if (trustScore) {
    trustScore.reportsReceived += 1;
    await trustScore.save();
    await updateUserTrustScore(userId);
  }
};
