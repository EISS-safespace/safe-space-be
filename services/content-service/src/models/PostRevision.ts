import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

interface PostRevisionAttributes {
  id: string;
  postId: string;
  content: string;
  triggerWarnings: string[];
  imageUrls?: string[];
  audioUrl?: string;
  editedBy: string; // User ID who made the edit
  createdAt?: Date;
}

interface PostRevisionCreationAttributes
  extends Optional<PostRevisionAttributes, 'id' | 'createdAt'> {}

class PostRevision
  extends Model<PostRevisionAttributes, PostRevisionCreationAttributes>
  implements PostRevisionAttributes
{
  declare id: string;
  declare postId: string;
  declare content: string;
  declare triggerWarnings: string[];
  declare imageUrls?: string[];
  declare audioUrl?: string;
  declare editedBy: string;
  declare readonly createdAt: Date;
}

PostRevision.init(
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
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    triggerWarnings: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    imageUrls: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    audioUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    editedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  },
  {
    sequelize,
    tableName: 'post_revisions',
    timestamps: true,
    updatedAt: false, // Only track creation time for revisions
    indexes: [
      {
        fields: ['postId'],
      },
      {
        fields: ['createdAt'],
      },
    ],
  },
);

export default PostRevision;
