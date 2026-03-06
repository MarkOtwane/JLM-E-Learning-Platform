import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating users with emailVerified = false to true...');

  const result = await prisma.user.updateMany({
    where: {
      emailVerified: false,
    },
    data: {
      emailVerified: true,
    },
  });

  console.log(`Updated ${result.count} users.`);

  // Also update isApproved for instructors who are not approved
  const instructorResult = await prisma.user.updateMany({
    where: {
      role: 'INSTRUCTOR',
      isApproved: false,
    },
    data: {
      isApproved: true,
    },
  });

  console.log(`Updated ${instructorResult.count} instructor accounts.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
