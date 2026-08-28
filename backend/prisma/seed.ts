import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const users = [
  { name: 'Super Admin', email: 'superadmin@gmail.com', role: 'super-admin' },
  { name: 'Admin', email: 'admin@gmail.com', role: 'Admin' },
  { name: 'Lead', email: 'lead@gmail.com', role: 'Lead' },
  { name: 'Member', email: 'member@gmail.com', role: 'Member' },
];

const PASSWORD = '12345';

async function main() {
  const password_hash = await bcrypt.hash(PASSWORD, 10);

  for (const user of users) {
    const existing = await prisma.teamMember.findUnique({
      where: { email: user.email },
    });

    if (existing) {
      console.log(`[seed] ${user.role} already exists (${user.email}). Skipping.`);
      continue;
    }

    await prisma.teamMember.create({
      data: {
        name: user.name,
        email: user.email,
        role: user.role,
        password_hash,
        is_first_login: true,
      },
    });

    console.log(`[seed] Created ${user.role}: ${user.email}`);
  }
}

main()
  .catch((e) => {
    console.error('[seed] Failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
