import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

interface AnonymousIdentityAttributes {
  id: string;
  userId: string;
  postId: string;
  animal: string;
  color: string;
  displayName: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AnonymousIdentityCreationAttributes
  extends Optional<
    AnonymousIdentityAttributes,
    'id' | 'createdAt' | 'updatedAt'
  > {}

class AnonymousIdentity
  extends Model<
    AnonymousIdentityAttributes,
    AnonymousIdentityCreationAttributes
  >
  implements AnonymousIdentityAttributes
{
  declare id: string;
  declare userId: string;
  declare postId: string;
  declare animal: string;
  declare color: string;
  declare displayName: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

AnonymousIdentity.init(
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
    postId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'posts',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    animal: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    displayName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'anonymous_identities',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['postId'],
        unique: true,
      },
    ],
  },
);

export default AnonymousIdentity;
