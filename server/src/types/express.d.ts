// Type declarations for the project
// This file helps TypeScript recognize modules without @types packages

declare global {
  namespace Express {
    export interface Request {
      user?: import('../database/User.js').User;
      file?: import('multer').File;
    }
  }
}

export {};

