/* eslint-disable @typescript-eslint/no-empty-object-type */

import { ImageKit } from '@imagekit/nodejs';
import { User } from 'generated/prisma/client';
import { ImageKitFolder } from '../modules/file/folder.interceptor';

/* eslint-disable @typescript-eslint/no-namespace */
export type EnvVariables = {
  DATABASE_URL: string;
  NODE_ENV?: string;
  DATABASE_HOST: string;
  DATABASE_USER: string;
  DATABASE_PASSWORD: string;
  DATABASE_NAME: string;
  DATABASE_PORT: string;
  JWT_SECRET: string;
  IMAGEKIT_SECRET_KEY: string;
};

declare global {
  namespace NodeJS {
    interface ProcessEnv extends EnvVariables {}
  }
  namespace Express {
    namespace Multer {
      interface File extends ImageKit.Files.FileUploadResponse {}
    }
    export interface Request {
      user?: User;
      folder?: ImageKitFolder;
    }
  }
}
