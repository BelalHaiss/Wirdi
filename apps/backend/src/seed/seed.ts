import { faker, fakerAR } from '@faker-js/faker';

import { cleanUpDatabase } from './cleanup.seed';
import { SEED_NUMBER, TOTAL_MODERATORS, TOTAL_LEARNERS } from './seed.constants';
import { seedUsers } from './user.seed';
import { prismaSeedClient } from './seed.util';

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
