import User from './User.js';
import Session from './Session.js';
import LoginAttempt from './LoginAttempt.js';
import VerificationToken from './VerificationToken.js';

// Define associations
User.hasMany(Session, { foreignKey: 'userId', as: 'sessions' });
Session.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(VerificationToken, { foreignKey: 'userId', as: 'verificationTokens' });
VerificationToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export { User, Session, LoginAttempt, VerificationToken };

