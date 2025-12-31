import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

interface CommentAttributes {
  id: string;
  postId: string;
  userId: string;
  content: string;
  isAnonymous: boolean;
  parentId?: string; // For nested comments/replies
  isEdited: boolean;
  editedAt?: Date;
  deletedAt?: Date; // Soft delete
  createdAt?: Date;
  updatedAt?: Date;
}

interface CommentCreationAttributes
  extends Optional<CommentAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Comment
  extends Model<CommentAttributes, CommentCreationAttributes>
  implements CommentAttributes
{
  declare id: string;
  declare postId: string;
  declare userId: string;
  declare content: string;
  declare isAnonymous: boolean;
  declare parentId?: string;
  declare isEdited: boolean;
  declare editedAt?: Date;
  declare deletedAt?: Date;
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
      onDelete: 'CASCADE',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isAnonymous: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'comments',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    isEdited: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    editedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'comments',
    timestamps: true,
    paranoid: false, // We handle soft delete manually with deletedAt
    indexes: [
      {
        fields: ['postId'],
      },
      {
        fields: ['userId'],
      },
      {
        fields: ['parentId'],
      },
      {
        fields: ['createdAt'],
      },
    ],
  },
);

export default Comment;
