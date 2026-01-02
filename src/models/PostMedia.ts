import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

export enum MediaType {
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
}

interface PostMediaAttributes {
  id: string;
  postId: string;
  mediaType: MediaType;
  originalUrl: string;
  thumbnailUrl?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
  duration?: number; // For audio/video in seconds
  altText?: string; // For accessibility
  uploadedAt: Date;
  deletedAt?: Date;
}

interface PostMediaCreationAttributes
  extends Optional<PostMediaAttributes, 'id' | 'uploadedAt'> {}

class PostMedia
  extends Model<PostMediaAttributes, PostMediaCreationAttributes>
  implements PostMediaAttributes
{
  declare id: string;
  declare postId: string;
  declare mediaType: MediaType;
  declare originalUrl: string;
  declare thumbnailUrl?: string;
  declare fileName: string;
  declare fileSize: number;
  declare mimeType: string;
  declare width?: number;
  declare height?: number;
  declare duration?: number;
  declare altText?: string;
  declare readonly uploadedAt: Date;
  declare deletedAt?: Date;
}

PostMedia.init(
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
    mediaType: {
      type: DataTypes.ENUM(...Object.values(MediaType)),
      allowNull: false,
    },
    originalUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    thumbnailUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    width: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    altText: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    uploadedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'post_media',
    timestamps: false,
    indexes: [
      {
        fields: ['postId'],
      },
      {
        fields: ['mediaType'],
      },
      {
        fields: ['uploadedAt'],
      },
    ],
  },
);

export default PostMedia;
