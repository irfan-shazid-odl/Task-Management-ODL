import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Business tables to clear. `team_members` (login accounts / roles) and the
// Prisma migration history are deliberately left untouched.
const TABLES = [
  'task_assignments',
  'time_logs',
  'conversation_attachments',
  'tasks',
  'activity_logs',
  'client_conversations',
  'project_documents',
  'project_credentials',
  'project_knowledge',
  'project_ai_messages',
  'projects',
  'clients',
  'subscriptions',
  'password_vault',
  'file_assets',
];

async function count(table: string): Promise<number> {
  const row: { count: string }[] = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) AS count FROM "${table}"`,
  );
  return Number(row[0]?.count ?? 0);
}

async function main() {
  console.log('[clean] Clearing business data (keeping team_members / login accounts)...\n');

  const before: Record<string, number> = {};
  for (const table of TABLES) {
    before[table] = await count(table);
  }

  const totalBefore = Object.values(before).reduce((a, b) => a + b, 0);
  console.log(`[clean] ${totalBefore} rows across ${TABLES.length} tables to remove.`);

  // Single atomic TRUNCATE ... CASCADE — no FK ordering concerns.
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${TABLES.map((t) => `"${t}"`).join(', ')} CASCADE`);

  const members = await count('team_members');
  console.log('[clean] Done. Remaining team_members (login accounts):', members);

  const remaining = await Promise.all(TABLES.map(async (table) => ({ table, count: await count(table) })));
  const totalAfter = remaining.reduce((a, r) => a + r.count, 0);
  if (totalAfter > 0) {
    console.log('[clean] WARNING: not all tables are empty:', remaining.filter((r) => r.count > 0));
  } else {
    console.log('[clean] All business tables are now empty. Database is ready to test fresh.');
  }
}

main()
  .catch((e) => {
    console.error('[clean] Failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());