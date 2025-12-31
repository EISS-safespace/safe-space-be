import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

interface UserProfileAttributes {
  id: string;
  userId: string;
  bio?: string;
  interests?: string[];
  location?: string;
  website?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  pronouns?: string;
  birthDate?: Date;
  phoneNumber?: string;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserProfileCreationAttributes
  extends Optional<UserProfileAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class UserProfile
  extends Model<UserProfileAttributes, UserProfileCreationAttributes>
  implements UserProfileAttributes
{
  declare id: string;
  declare userId: string;
  declare bio?: string;
  declare interests?: string[];
  declare location?: string;
  declare website?: string;
  declare socialLinks?: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  declare pronouns?: string;
  declare birthDate?: Date;
  declare phoneNumber?: string;
  declare emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

UserProfile.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    interests: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    socialLinks: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    pronouns: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    birthDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    emergencyContact: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'user_profiles',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
      },
    ],
  },
);

export default UserProfile;
