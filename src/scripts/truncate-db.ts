import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function truncateDatabase() {
  try {
    console.log('Truncating database...');

    // Delete all records from each table
    // Using deleteMany instead of TRUNCATE to avoid foreign key issues
    // and to work better with Prisma
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
