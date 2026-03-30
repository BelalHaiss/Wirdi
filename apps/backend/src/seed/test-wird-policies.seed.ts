/**
 * Dedicated seed runner for testing wird tracking policies
 * Run: pnpm seed:test:wird
 */

import 'dotenv/config';

import { seedUsers } from './user.seed';
import { seedWirdTracking } from './wird-tracking.seed';
import { prismaSeedClient } from './seed.util';
import { cleanUpDatabase } from './cleanup.seed';
import { faker, fakerAR } from '@faker-js/faker';

const SEED_NUMBER = 12345;

async function main() {
  try {
    console.log('🧪 Starting wird policies test seed...\n');

    faker.seed(SEED_NUMBER);
    fakerAR.seed(SEED_NUMBER);

    // Clean database
    await cleanUpDatabase(prismaSeedClient);

    // Seed users (admin, moderators, students)
    await seedUsers({
      prisma: prismaSeedClient,
      totalModerators: 2,
      totalLearners: 15,
    });

    // Seed wird tracking test data
    await seedWirdTracking(prismaSeedClient);

    console.log('\n✨ Test seed completed!\n');
    console.log('📝 Next steps:');
    console.log('  1. Login: username=admin, password=12345678');
    console.log('  2. Navigate to group "حلقة الاختبار"');
    console.log('  3. Check different student scenarios');
    console.log('  4. Wait for cron (4PM Riyadh) or manually trigger it');
    console.log('  5. Verify MISSED records and alerts are created\n');
  } catch (error) {
    console.error('❌ Seed error:', error);
    throw error;
  }
}

main()
  .then(async () => {
    await prismaSeedClient.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prismaSeedClient.$disconnect();
    process.exit(1);
  });
