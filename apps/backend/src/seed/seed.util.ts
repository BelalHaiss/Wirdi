import { PrismaClient } from 'generated/prisma/client';
import { createMariaDbAdapter } from 'src/modules/database/database.util';
export const prismaSeedClient = new PrismaClient({
  adapter: createMariaDbAdapter({
    DATABASE_HOST: process.env.DATABASE_HOST,
    DATABASE_USER: process.env.DATABASE_USER,
    DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,
    DATABASE_NAME: process.env.DATABASE_NAME,
    DATABASE_PORT: process.env.DATABASE_PORT,
  }),
});
