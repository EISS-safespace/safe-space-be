import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

export enum StoryCategory {
  ANXIETY = 'anxiety',
  DEPRESSION = 'depression',
  PTSD = 'ptsd',
  EATING_DISORDER = 'eating_disorder',
  ADDICTION = 'addiction',
  GRIEF = 'grief',
  TRAUMA = 'trauma',
  SELF_HARM = 'self_harm',
  BIPOLAR = 'bipolar',
  OCD = 'ocd',
  GENERAL = 'general',
}

export enum StoryStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FEATURED = 'featured',
}

interface HopeStoryAttributes {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: StoryCategory;
  status: StoryStatus;
  isAnonymous: boolean;
  checkIns?: string[]; // Array of check-in updates
  lastCheckInAt?: Date;
  viewCount: number;
  featuredAt?: Date;
  approvedAt?: Date;
  approvedBy?: string; // Moderator user ID
  rejectionReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface HopeStoryCreationAttributes
  extends Optional<
    HopeStoryAttributes,
    'id' | 'createdAt' | 'updatedAt' | 'viewCount'
  > {}

class HopeStory
  extends Model<HopeStoryAttributes, HopeStoryCreationAttributes>
  implements HopeStoryAttributes
{
  declare id: string;
  declare userId: string;
  declare title: string;
  declare content: string;
  declare category: StoryCategory;
  declare status: StoryStatus;
  declare isAnonymous: boolean;
  declare checkIns?: string[];
  declare lastCheckInAt?: Date;
  declare viewCount: number;
  declare featuredAt?: Date;
  declare approvedAt?: Date;
  declare approvedBy?: string;
  declare rejectionReason?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

HopeStory.init(
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
      onDelete: 'CASCADE',
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM(...Object.values(StoryCategory)),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(StoryStatus)),
      defaultValue: StoryStatus.PENDING,
    },
    isAnonymous: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    checkIns: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: [],
    },
    lastCheckInAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    featuredAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    approvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'hope_stories',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['category'],
      },
      {
        fields: ['status'],
      },
    ],
  },
);

export default HopeStory;
