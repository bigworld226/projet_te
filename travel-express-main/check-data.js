
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      fullName: {
        contains: 'Jean',
        mode: 'insensitive'
      }
    },
    include: {
        applications: {
            include: {
                documents: true
            }
        }
    }
  });

  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
