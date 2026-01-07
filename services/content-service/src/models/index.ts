import User from './User.js';
import Post from './Post.js';
import Comment from './Comment.js';
import Reaction from './Reaction.js';
import HopeStory from './HopeStory.js';
import Quote from './Quote.js';
import PostRevision from './PostRevision.js';
import MoodEntry from './MoodEntry.js';

// Define associations
User.hasMany(Post, { foreignKey: 'userId', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Post.hasMany(Comment, { foreignKey: 'postId', as: 'comments' });
Comment.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

Comment.hasMany(Comment, { foreignKey: 'parentCommentId', as: 'replies' });
Comment.belongsTo(Comment, { foreignKey: 'parentCommentId', as: 'parentComment' });

User.hasMany(Reaction, { foreignKey: 'userId', as: 'reactions' });
Reaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Post.hasMany(Reaction, { foreignKey: 'postId', as: 'reactions' });
Reaction.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

Comment.hasMany(Reaction, { foreignKey: 'commentId', as: 'reactions' });
Reaction.belongsTo(Comment, { foreignKey: 'commentId', as: 'comment' });

User.hasMany(HopeStory, { foreignKey: 'userId', as: 'hopeStories' });
HopeStory.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Quote, { foreignKey: 'submittedBy', as: 'quotes' });
Quote.belongsTo(User, { foreignKey: 'submittedBy', as: 'submitter' });

Post.hasMany(PostRevision, { foreignKey: 'postId', as: 'revisions' });
PostRevision.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

User.hasMany(MoodEntry, { foreignKey: 'userId', as: 'moodEntries' });
MoodEntry.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export { User, Post, Comment, Reaction, HopeStory, Quote, PostRevision, MoodEntry };

