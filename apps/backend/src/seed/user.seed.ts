import { User, PrismaClient } from 'generated/prisma/client';
import { faker, fakerAR } from '@faker-js/faker';
import argon from 'argon2';
import { UserRole } from '@wirdi/shared';

const seedTimezones = [
  'Africa/Cairo',
  'Asia/Riyadh',
  'Asia/Dubai',
  'Europe/Istanbul',
  'America/New_York',
];

export const seedAppUser = async (username: string, role: UserRole) => {
  const user: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
    name: fakerAR.person.fullName(),
    role,
    password: await argon.hash('12345678'),
    username,
    timezone: faker.helpers.arrayElement(seedTimezones),
    notes: faker.datatype.boolean(0.2) ? fakerAR.lorem.sentence() : null,
  };

  return user;
};

export async function seedUsers(args: {
  prisma: PrismaClient;
  totalModerators: number;
  totalLearners: number;
}): Promise<{ students: { id: string }[] }> {
  const defaultPassword = await argon.hash('12345678');

  const staffUsers = await Promise.all([
    seedAppUser('admin', 'ADMIN'),
    seedAppUser('moderator', 'MODERATOR'),
    ...Array.from({ length: args.totalModerators - 1 }, (_, index) =>
      seedAppUser(`moderator${index + 2}`, 'MODERATOR')
    ),
  ]);

  const learners = Array.from({ length: args.totalLearners }, (_, index) => ({
    name: fakerAR.person.fullName(),
    role: 'STUDENT' as const,
    username: `student${index + 1}`,
    password: defaultPassword,
    timezone: faker.helpers.arrayElement(seedTimezones),
    notes: faker.datatype.boolean(0.45) ? fakerAR.lorem.sentence() : null,
  }));

  await args.prisma.user.createMany({
    data: [...staffUsers, ...learners],
  });

  const students = await args.prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: { id: true },
  });

  return { students };
}
