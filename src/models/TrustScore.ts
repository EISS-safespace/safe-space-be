import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

interface TrustScoreAttributes {
  id: string;
  userId: string;
  score: number;
  postsCount: number;
  helpfulReactionsReceived: number;
  reportsReceived: number;
  accountAge: number; // in days
  verifiedEmail: boolean;
  verifiedPhone: boolean;
  lastCalculatedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TrustScoreCreationAttributes
  extends Optional<TrustScoreAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class TrustScore
  extends Model<TrustScoreAttributes, TrustScoreCreationAttributes>
  implements TrustScoreAttributes
{
  declare id: string;
  declare userId: string;
  declare score: number;
  declare postsCount: number;
  declare helpfulReactionsReceived: number;
  declare reportsReceived: number;
  declare accountAge: number;
  declare verifiedEmail: boolean;
  declare verifiedPhone: boolean;
  declare lastCalculatedAt: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

TrustScore.init(
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
    score: {
      type: DataTypes.INTEGER,
      defaultValue: 50,
      validate: {
        min: 0,
        max: 100,
      },
    },
    postsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    helpfulReactionsReceived: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    reportsReceived: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    accountAge: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    verifiedEmail: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    verifiedPhone: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    lastCalculatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'trust_scores',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['score'],
      },
    ],
  },
);

export default TrustScore;

