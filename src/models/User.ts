import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

interface UserAttributes {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  isVerifiedTherapist: boolean;
  allowAnonymous: boolean;
  emailVerified: boolean;
  emailVerifiedAt?: Date;
  phoneNumber?: string;
  phoneVerified: boolean;
  accountLocked: boolean;
  lockReason?: string;
  lockedAt?: Date;
  failedLoginAttempts: number;
  lastLoginAt?: Date;
  lastLoginIp?: string;
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
  declare passwordHash: string;
  declare displayName?: string;
  declare bio?: string;
  declare avatarUrl?: string;
  declare isVerifiedTherapist: boolean;
  declare allowAnonymous: boolean;
  declare emailVerified: boolean;
  declare emailVerifiedAt?: Date;
  declare phoneNumber?: string;
  declare phoneVerified: boolean;
  declare accountLocked: boolean;
  declare lockReason?: string;
  declare lockedAt?: Date;
  declare failedLoginAttempts: number;
  declare lastLoginAt?: Date;
  declare lastLoginIp?: string;
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
      validate: {
        isEmail: true,
      },
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    displayName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    avatarUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isVerifiedTherapist: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    allowAnonymous: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    emailVerifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phoneVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    accountLocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    lockReason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lockedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    failedLoginAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastLoginIp: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
  },
);

export default User;
