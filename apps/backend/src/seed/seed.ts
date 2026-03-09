import { faker, fakerAR } from '@faker-js/faker';
import { PrismaClient } from 'generated/prisma/client';
import { createMariaDbAdapter } from 'src/modules/database/database.util';
import { cleanUpDatabase } from './cleanup.seed';
import { SEED_NUMBER, TOTAL_MODERATORS, TOTAL_LEARNERS } from './seed.constants';
import { seedUsers } from './user.seed';

export const prismaSeedClient = new PrismaClient({
  adapter: createMariaDbAdapter({
    DATABASE_HOST: process.env.DATABASE_HOST,
    DATABASE_USER: process.env.DATABASE_USER,
    DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,
    DATABASE_NAME: process.env.DATABASE_NAME,
    DATABASE_PORT: process.env.DATABASE_PORT,
  }),
});

export const seedData = async () => {
  try {
    faker.seed(SEED_NUMBER);
    fakerAR.seed(SEED_NUMBER);

    await cleanUpDatabase(prismaSeedClient);

    await seedUsers({
      prisma: prismaSeedClient,
      totalModerators: TOTAL_MODERATORS,
      totalLearners: TOTAL_LEARNERS,
    });

    console.log('Data seeded successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

seedData()
  .then(async () => {
    await prismaSeedClient.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prismaSeedClient.$disconnect();
    process.exit(1);
  });
