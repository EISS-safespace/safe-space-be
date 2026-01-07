import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

export enum MoodType {
  VERY_HAPPY = 'very_happy',
  HAPPY = 'happy',
  NEUTRAL = 'neutral',
  SAD = 'sad',
  VERY_SAD = 'very_sad',
  ANXIOUS = 'anxious',
  STRESSED = 'stressed',
}

interface MoodEntryAttributes {
  id: string;
  userId: string;
  mood: MoodType;
  intensity: number;
  notes?: string;
  date: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MoodEntryCreationAttributes
  extends Optional<MoodEntryAttributes, 'id' | 'notes' | 'createdAt' | 'updatedAt'> {}

class MoodEntry
  extends Model<MoodEntryAttributes, MoodEntryCreationAttributes>
  implements MoodEntryAttributes
{
  declare id: string;
  declare userId: string;
  declare mood: MoodType;
  declare intensity: number;
  declare notes?: string;
  declare date: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

MoodEntry.init(
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
    mood: {
      type: DataTypes.ENUM(...Object.values(MoodType)),
      allowNull: false,
    },
    intensity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 10,
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'mood_entries',
    timestamps: true,
    indexes: [
      {
        fields: ['userId', 'date'],
      },
      {
        fields: ['date'],
      },
    ],
  },
);

export default MoodEntry;

