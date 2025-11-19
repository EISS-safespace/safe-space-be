import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

export enum RoomType {
  PRIVATE = 'private',
  GROUP = 'group',
  SUPPORT = 'support',
}

interface ChatRoomAttributes {
  id: string;
  name?: string;
  roomType: RoomType;
  topic?: string;
  maxParticipants: number;
  isTemporary: boolean;
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ChatRoomCreationAttributes extends Optional<ChatRoomAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class ChatRoom extends Model<ChatRoomAttributes, ChatRoomCreationAttributes> implements ChatRoomAttributes {
  declare id: string;
  declare name?: string;
  declare roomType: RoomType;
  declare topic?: string;
  declare maxParticipants: number;
  declare isTemporary: boolean;
  declare expiresAt?: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ChatRoom.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    roomType: {
      type: DataTypes.ENUM(...Object.values(RoomType)),
      allowNull: false,
    },
    topic: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    maxParticipants: {
      type: DataTypes.INTEGER,
      defaultValue: 8,
    },
    isTemporary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'chat_rooms',
    timestamps: true,
  }
);

export default ChatRoom;

