import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

// Simplified User model for content service (read-only)
interface UserAttributes {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  coverPhotoUrl?: string;
  isVerifiedTherapist: boolean;
  emailVerified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes
  extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  declare id: string;
  declare email: string;
  declare username: string;
  declare displayName?: string;
  declare avatarUrl?: string;
  declare bio?: string;
  declare coverPhotoUrl?: string;
  declare isVerifiedTherapist: boolean;
  declare emailVerified: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    displayName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    avatarUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    coverPhotoUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isVerifiedTherapist: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
  },
);

export default User;

