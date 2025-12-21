import { DataTypes, Model, Optional, Op } from 'sequelize';
import sequelize from '../config/database.js';

export enum ReactionType {
  ME_TOO = 'me_too',
  SUPPORT = 'support',
  HELPFUL = 'helpful',
}

interface ReactionAttributes {
  id: string;
  postId?: string | null;
  commentId?: string | null;
  userId: string;
  reactionType: ReactionType;
  createdAt?: Date;
  updatedAt?: Date;
}


interface ReactionCreationAttributes extends Optional<ReactionAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Reaction extends Model<ReactionAttributes, ReactionCreationAttributes> implements ReactionAttributes {
  declare id: string;
  declare postId: string | null  ;
  declare commentId: string | null;
  declare userId: string;
  declare reactionType: ReactionType;
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
    postId: {
  type: DataTypes.UUID,
  allowNull: true,
  references: {
    model: 'posts',
    key: 'id',
  },
},
commentId: {
  type: DataTypes.UUID,
  allowNull: true,
  references: {
    model: 'comments',
    key: 'id',
  },
},

    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    reactionType: {
      type: DataTypes.ENUM(...Object.values(ReactionType)),
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
    fields: ['postId', 'userId', 'reactionType'],
    where: {
      postId: { [Op.ne]: null },
    },
  },
  {
    unique: true,
    fields: ['commentId', 'userId', 'reactionType'],
    where: {
      commentId: { [Op.ne]: null },
    },
  },
],

  }
);

export default Reaction;

