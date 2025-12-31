import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

interface LoginAttemptAttributes {
  id: string;
  email: string;
  ipAddress: string;
  userAgent?: string;
  successful: boolean;
  failureReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface LoginAttemptCreationAttributes
  extends Optional<LoginAttemptAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class LoginAttempt
  extends Model<LoginAttemptAttributes, LoginAttemptCreationAttributes>
  implements LoginAttemptAttributes
{
  declare id: string;
  declare email: string;
  declare ipAddress: string;
  declare userAgent?: string;
  declare successful: boolean;
  declare failureReason?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

LoginAttempt.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    successful: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    failureReason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'login_attempts',
    timestamps: true,
    indexes: [
      {
        fields: ['email'],
      },
      {
        fields: ['ipAddress'],
      },
      {
        fields: ['createdAt'],
      },
    ],
  },
);

export default LoginAttempt;
