import bcrypt from 'bcrypt';
import { config } from '../config/index.js';

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, config.bcryptRounds);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

