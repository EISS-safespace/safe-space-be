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
import HopeStory from './HopeStory.js';
import Quote from './Quote.js';
import PostRevision from './PostRevision.js';
import PostMedia from './PostMedia.js';

// Define associations
User.hasMany(Post, { foreignKey: 'userId', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Post.hasMany(Comment, { foreignKey: 'postId', as: 'comments' });
Comment.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

// Comment self-referencing for nested replies
Comment.hasMany(Comment, { foreignKey: 'parentId', as: 'replies' });
Comment.belongsTo(Comment, { foreignKey: 'parentId', as: 'parent' });

User.hasMany(Reaction, { foreignKey: 'userId', as: 'reactions' });
Reaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Note: Reactions are now polymorphic (can be on posts or comments)
// We handle this manually in queries using reactableType and reactableId

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

User.hasMany(VerificationToken, {
  foreignKey: 'userId',
  as: 'verificationTokens',
});
VerificationToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(AnonymousIdentity, {
  foreignKey: 'userId',
  as: 'anonymousIdentities',
});
AnonymousIdentity.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Post.hasOne(AnonymousIdentity, {
  foreignKey: 'postId',
  as: 'anonymousIdentity',
});
AnonymousIdentity.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

// Hope Story associations
User.hasMany(HopeStory, { foreignKey: 'userId', as: 'hopeStories' });
HopeStory.belongsTo(User, { foreignKey: 'userId', as: 'author' });

// Post Revision associations
Post.hasMany(PostRevision, { foreignKey: 'postId', as: 'revisions' });
PostRevision.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

User.hasMany(PostRevision, { foreignKey: 'editedBy', as: 'postEdits' });
PostRevision.belongsTo(User, { foreignKey: 'editedBy', as: 'editor' });

// Post Media associations
Post.hasMany(PostMedia, { foreignKey: 'postId', as: 'media' });
PostMedia.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

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
  HopeStory,
  Quote,
  PostRevision,
  PostMedia,
};
