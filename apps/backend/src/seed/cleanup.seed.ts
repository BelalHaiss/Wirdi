import { PrismaClient } from 'generated/prisma/client';

export async function cleanUpDatabase(prisma: PrismaClient): Promise<void> {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.studentWird.deleteMany();
      await tx.scheduleImage.deleteMany();
      await tx.week.deleteMany();
      await tx.request.deleteMany();
      await tx.groupMember.deleteMany();
      await tx.group.deleteMany();
      await tx.user.deleteMany();
    });
    console.log('Database cleaned successfully');
  } catch (error) {
    console.error('Error cleaning database:', error);
  }
}
