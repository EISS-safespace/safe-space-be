import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

interface UserSettingsAttributes {
  id: string;
  userId: string;
  // Privacy settings
  profileVisibility: 'public' | 'friends' | 'private';
  showEmail: boolean;
  showLocation: boolean;
  allowMessagesFrom: 'everyone' | 'friends' | 'none';
  // Notification preferences
  emailNotifications: boolean;
  pushNotifications: boolean;
  notifyOnComment: boolean;
  notifyOnReaction: boolean;
  notifyOnMessage: boolean;
  notifyOnMention: boolean;
  // Content preferences
  contentWarnings: boolean;
  blurSensitiveContent: boolean;
  // Anonymous posting
  defaultAnonymous: boolean;
  // Accessibility
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  reducedMotion: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserSettingsCreationAttributes
  extends Optional<UserSettingsAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class UserSettings
  extends Model<UserSettingsAttributes, UserSettingsCreationAttributes>
  implements UserSettingsAttributes
{
  declare id: string;
  declare userId: string;
  declare profileVisibility: 'public' | 'friends' | 'private';
  declare showEmail: boolean;
  declare showLocation: boolean;
  declare allowMessagesFrom: 'everyone' | 'friends' | 'none';
  declare emailNotifications: boolean;
  declare pushNotifications: boolean;
  declare notifyOnComment: boolean;
  declare notifyOnReaction: boolean;
  declare notifyOnMessage: boolean;
  declare notifyOnMention: boolean;
  declare contentWarnings: boolean;
  declare blurSensitiveContent: boolean;
  declare defaultAnonymous: boolean;
  declare theme: 'light' | 'dark' | 'auto';
  declare fontSize: 'small' | 'medium' | 'large';
  declare reducedMotion: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

UserSettings.init(
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
    profileVisibility: {
      type: DataTypes.ENUM('public', 'friends', 'private'),
      defaultValue: 'public',
    },
    showEmail: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    showLocation: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    allowMessagesFrom: {
      type: DataTypes.ENUM('everyone', 'friends', 'none'),
      defaultValue: 'friends',
    },
    emailNotifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    pushNotifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    notifyOnComment: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    notifyOnReaction: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    notifyOnMessage: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    notifyOnMention: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    contentWarnings: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    blurSensitiveContent: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    defaultAnonymous: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    theme: {
      type: DataTypes.ENUM('light', 'dark', 'auto'),
      defaultValue: 'auto',
    },
    fontSize: {
      type: DataTypes.ENUM('small', 'medium', 'large'),
      defaultValue: 'medium',
    },
    reducedMotion: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'user_settings',
    timestamps: true,
  },
);

export default UserSettings;
