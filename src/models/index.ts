import User from './User.js';
import Post from './Post.js';
import Comment from './Comment.js';
import Reaction from './Reaction.js';
import MoodEntry from './MoodEntry.js';
import ChatRoom from './ChatRoom.js';

// Define associations
User.hasMany(Post, { foreignKey: 'userId', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Post.hasMany(Comment, { foreignKey: 'postId', as: 'comments' });
Comment.belongsTo(Post, { foreignKey: 'postId', as: 'post' });
// Self-referencing comment replies
Comment.hasMany(Comment, {
  foreignKey: 'parentId',
  as: 'replies',
});

Comment.belongsTo(Comment, {
  foreignKey: 'parentId',
  as: 'parent',
});

User.hasMany(Reaction, { foreignKey: 'userId', as: 'reactions' });
Reaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Post.hasMany(Reaction, { foreignKey: 'postId', as: 'reactions' });
Reaction.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

User.hasMany(MoodEntry, { foreignKey: 'userId', as: 'moodEntries' });
MoodEntry.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export { User, Post, Comment, Reaction, MoodEntry, ChatRoom };

