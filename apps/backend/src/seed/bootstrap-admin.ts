import argon from 'argon2';
import { prismaSeedClient } from './seed.util';

async function bootstrapAdmin() {
  const hashedPassword = await argon.hash('12345678');

  const adminExists = await prismaSeedClient.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!adminExists) {
    await prismaSeedClient.user.create({
      data: {
        phone: '+201507770400',
        name: 'System Admin',
        nameNormalized: 'System Admin',
        role: 'ADMIN',
        password: hashedPassword,
        timezone: 'Africa/Cairo',
        notes: null,
      },
    });
  }

  console.log(
    adminExists
      ? 'Admin already exists, skipping.'
      : 'Bootstrap admin created (phone: +201507770400)'
  );
}

bootstrapAdmin()
  .catch((error) => {
    console.error('Bootstrap admin failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prismaSeedClient.$disconnect();
  });
