import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

interface SessionAttributes {
  id: string;
  userId: string;
  refreshToken: string;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SessionCreationAttributes
  extends Optional<SessionAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Session
  extends Model<SessionAttributes, SessionCreationAttributes>
  implements SessionAttributes
{
  declare id: string;
  declare userId: string;
  declare refreshToken: string;
  declare deviceInfo?: string;
  declare ipAddress?: string;
  declare userAgent?: string;
  declare expiresAt: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Session.init(
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
    refreshToken: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true,
    },
    deviceInfo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'sessions',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['refreshToken'],
      },
      {
        fields: ['expiresAt'],
      },
    ],
  },
);

export default Session;
