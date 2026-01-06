import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

export enum ReactionType {
  ME_TOO = 'me_too',
  HEART = 'heart',
  HUG = 'hug',
  SUPPORT = 'support',
  CELEBRATE = 'celebrate',
  HELPFUL = 'helpful',
}

interface ReactionAttributes {
  id: string;
  userId: string;
  reactionType: ReactionType;
  reactableType: 'post' | 'comment'; // Polymorphic association
  reactableId: string; // ID of post or comment
  createdAt?: Date;
  updatedAt?: Date;
}

interface ReactionCreationAttributes
  extends Optional<ReactionAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Reaction
  extends Model<ReactionAttributes, ReactionCreationAttributes>
  implements ReactionAttributes
{
  declare id: string;
  declare userId: string;
  declare reactionType: ReactionType;
  declare reactableType: 'post' | 'comment';
  declare reactableId: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Reaction.init(
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
    reactionType: {
      type: DataTypes.ENUM(...Object.values(ReactionType)),
      allowNull: false,
    },
    reactableType: {
      type: DataTypes.ENUM('post', 'comment'),
      allowNull: false,
    },
    reactableId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'reactions',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['reactableType', 'reactableId', 'userId', 'reactionType'],
        name: 'unique_reaction_per_user',
      },
      {
        fields: ['reactableType', 'reactableId'],
      },
      {
        fields: ['userId'],
      },
    ],
  },
);

export default Reaction;
