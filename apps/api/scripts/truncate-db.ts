import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function truncateDatabase() {
  try {
    console.log('Truncating database...');

    const [activitiesDeleted, tokensDeleted] = await Promise.all([
      prisma.activity.deleteMany(),
      prisma.stravaToken.deleteMany(),
    ]);

    console.log(`Deleted ${activitiesDeleted.count} activities`);
    console.log(`Deleted ${tokensDeleted.count} tokens`);
    console.log('Database truncated successfully!');
  } catch (error) {
    console.error('Error truncating database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

truncateDatabase();
