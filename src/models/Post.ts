import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

export enum PostType {
  VENT = 'vent',
  SUCCESS = 'success',
  QUESTION = 'question',
  GENERAL = 'general',
}

export enum TriggerWarning {
  ANXIETY = 'anxiety',
  DEPRESSION = 'depression',
  SELF_HARM = 'self_harm',
  EATING_DISORDER = 'eating_disorder',
  SUBSTANCE_ABUSE = 'substance_abuse',
  TRAUMA = 'trauma',
  SUICIDE = 'suicide',
}

interface PostAttributes {
  id: string;
  userId: string;
  content: string;
  isAnonymous: boolean;
  postType: PostType;
  triggerWarnings: TriggerWarning[];
  mood?: string;
  imageUrls?: string[];
  audioUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
}

interface PostCreationAttributes extends Optional<PostAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Post extends Model<PostAttributes, PostCreationAttributes> implements PostAttributes {
  declare id: string;
  declare userId: string;
  declare content: string;
  declare isAnonymous: boolean;
  declare postType: PostType;
  declare triggerWarnings: TriggerWarning[];
  declare mood?: string;
  declare imageUrls?: string[];
  declare audioUrl?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare isDeleted: boolean;
  declare deletedAt?: Date;
}

Post.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
    postType: {
      type: DataTypes.ENUM(...Object.values(PostType)),
      defaultValue: PostType.GENERAL,
    },
    triggerWarnings: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    mood: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    imageUrls: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    audioUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

  },
  {
    sequelize,
    tableName: 'posts',
    timestamps: true,
  }
);

export default Post;

