import { Request } from 'express';

// Extend Request to include cookies from cookie-parser
export interface CookieRequest extends Request {
  cookies?: { [key: string]: string };
}

// Extend Request to include file from multer
export interface FileRequest extends Request {
  file?: Express.Multer.File;
}

