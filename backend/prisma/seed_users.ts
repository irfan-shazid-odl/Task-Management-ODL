import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('123456', 10);

  // Admin user
  await prisma.teamMember.upsert({
    where: { email: 'admin@gmail.com' },
    update: { password_hash: password, role: 'Admin' },
    create: {
      email: 'admin@gmail.com',
      password_hash: password,
      name: 'Admin User',
      role: 'Admin'
    }
  });

  // Regular user
  await prisma.teamMember.upsert({
    where: { email: 'user@gmail.com' },
    update: { password_hash: password, role: 'Member' },
    create: {
      email: 'user@gmail.com',
      password_hash: password,
      name: 'Test User',
      role: 'Member'
    }
  });

  console.log('Seed: Added admin@gmail.com and user@gmail.com');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
