import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

export enum QuoteCategory {
  MOTIVATION = 'motivation',
  HOPE = 'hope',
  STRENGTH = 'strength',
  RECOVERY = 'recovery',
  SELF_LOVE = 'self_love',
  MINDFULNESS = 'mindfulness',
  GENERAL = 'general',
}

interface QuoteAttributes {
  id: string;
  text: string;
  author?: string;
  category: QuoteCategory;
  isFeatured: boolean;
  submittedBy?: string; // User ID who submitted
  createdAt?: Date;
  updatedAt?: Date;
}

interface QuoteCreationAttributes
  extends Optional<QuoteAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Quote
  extends Model<QuoteAttributes, QuoteCreationAttributes>
  implements QuoteAttributes
{
  declare id: string;
  declare text: string;
  declare author?: string;
  declare category: QuoteCategory;
  declare isFeatured: boolean;
  declare submittedBy?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Quote.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    author: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    category: {
      type: DataTypes.ENUM(...Object.values(QuoteCategory)),
      defaultValue: QuoteCategory.GENERAL,
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    submittedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
  },
  {
    sequelize,
    tableName: 'quotes',
    timestamps: true,
    indexes: [
      {
        fields: ['category'],
      },
      {
        fields: ['isFeatured'],
      },
    ],
  },
);

export default Quote;
