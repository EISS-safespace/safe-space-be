import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

interface CommentAttributes {
  id: string;
  postId: string;
  userId: string;
  content: string;
  isAnonymous: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface CommentCreationAttributes extends Optional<CommentAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Comment extends Model<CommentAttributes, CommentCreationAttributes> implements CommentAttributes {
  declare id: string;
  declare postId: string;
  declare userId: string;
  declare content: string;
  declare isAnonymous: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Comment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    postId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'posts',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isAnonymous: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'comments',
    timestamps: true,
  }
);

export default Comment;

