import User from './User.js';
import Post from './Post.js';
import Comment from './Comment.js';
import Reaction from './Reaction.js';
import MoodEntry from './MoodEntry.js';
import ChatRoom from './ChatRoom.js';
import Session from './Session.js';
import UserProfile from './UserProfile.js';
import UserSettings from './UserSettings.js';
import AnonymousIdentity from './AnonymousIdentity.js';
import TrustScore from './TrustScore.js';
import VerificationToken from './VerificationToken.js';
import LoginAttempt from './LoginAttempt.js';

// Define associations
User.hasMany(Post, { foreignKey: 'userId', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Post.hasMany(Comment, { foreignKey: 'postId', as: 'comments' });
Comment.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

User.hasMany(Reaction, { foreignKey: 'userId', as: 'reactions' });
Reaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Post.hasMany(Reaction, { foreignKey: 'postId', as: 'reactions' });
Reaction.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

User.hasMany(MoodEntry, { foreignKey: 'userId', as: 'moodEntries' });
MoodEntry.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// New associations for authentication and user management
User.hasMany(Session, { foreignKey: 'userId', as: 'sessions' });
Session.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(UserProfile, { foreignKey: 'userId', as: 'profile' });
UserProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(UserSettings, { foreignKey: 'userId', as: 'settings' });
UserSettings.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(TrustScore, { foreignKey: 'userId', as: 'trustScore' });
TrustScore.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(VerificationToken, { foreignKey: 'userId', as: 'verificationTokens' });
VerificationToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(AnonymousIdentity, { foreignKey: 'userId', as: 'anonymousIdentities' });
AnonymousIdentity.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Post.hasOne(AnonymousIdentity, { foreignKey: 'postId', as: 'anonymousIdentity' });
AnonymousIdentity.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

export {
  User,
  Post,
  Comment,
  Reaction,
  MoodEntry,
  ChatRoom,
  Session,
  UserProfile,
  UserSettings,
  AnonymousIdentity,
  TrustScore,
  VerificationToken,
  LoginAttempt,
};
