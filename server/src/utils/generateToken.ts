import jwt, { SignOptions } from 'jsonwebtoken';

export const generateToken = (id: string): string => {
  const options: SignOptions = {
    expiresIn: process.env.JWT_EXPIRE as string || '7d',
  };
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', options);
};

export const generateRefreshToken = (id: string): string => {
  const options: SignOptions = {
    expiresIn: process.env.JWT_REFRESH_EXPIRE as string || '30d',
  };
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'secret', options);
};






