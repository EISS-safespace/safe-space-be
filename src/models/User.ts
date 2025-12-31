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
  createdAt?: Date;
  updatedAt?: Date;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: string;
  declare email: string;
  declare username: string;
  declare passwordHash: string;
  declare displayName?: string;
  declare bio?: string;
  declare avatarUrl?: string;
  declare isVerifiedTherapist: boolean;
  declare allowAnonymous: boolean;
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
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
  }
);

export default User;

