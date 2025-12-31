import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

interface VerificationTokenAttributes {
  id: string;
  userId: string;
  token: string;
  type: 'email_verification' | 'password_reset';
  expiresAt: Date;
  usedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface VerificationTokenCreationAttributes
  extends Optional<
    VerificationTokenAttributes,
    'id' | 'createdAt' | 'updatedAt'
  > {}

class VerificationToken
  extends Model<
    VerificationTokenAttributes,
    VerificationTokenCreationAttributes
  >
  implements VerificationTokenAttributes
{
  declare id: string;
  declare userId: string;
  declare token: string;
  declare type: 'email_verification' | 'password_reset';
  declare expiresAt: Date;
  declare usedAt?: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

VerificationToken.init(
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
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    type: {
      type: DataTypes.ENUM('email_verification', 'password_reset'),
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'verification_tokens',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['token'],
      },
      {
        fields: ['type'],
      },
      {
        fields: ['expiresAt'],
      },
    ],
  },
);

export default VerificationToken;
