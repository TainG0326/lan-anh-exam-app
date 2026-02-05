import jwt from 'jsonwebtoken';

export const generateToken = (id: string): string => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' } as jwt.SignOptions
  );
};

export const generateRefreshToken = (id: string): string => {
  return jwt.sign(
    { id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'secret',
    { expiresIn: '30d' } as jwt.SignOptions
  );
};






