import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { cache } from '../../utils/cache.js';

const CACHE_TTL = 120_000; // 2 minutes
export async function getDashboardStats(memberId?: string, startDate?: string, endDate?: string) {
  const cacheKey = `dashboard-stats-${memberId || 'all'}-${startDate || 'none'}-${endDate || 'none'}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const taskWhere: Prisma.TaskWhereInput = {};
  if (memberId) {
    taskWhere.assignments = { some: { member_id: memberId } };
  }
  if (startDate || endDate) {
    taskWhere.created_at = {};
    if (startDate) taskWhere.created_at.gte = new Date(startDate + 'T00:00:00Z');
    if (endDate) taskWhere.created_at.lte = new Date(endDate + 'T23:59:59Z');
  }

  const logWhere: Prisma.TimeLogWhereInput = {};
  if (memberId) logWhere.member_id = memberId;
  if (startDate || endDate) {
    logWhere.log_date = {};
    if (startDate) logWhere.log_date.gte = new Date(startDate);
    if (endDate) logWhere.log_date.lte = new Date(endDate);
  }

  const conditions: Prisma.Sql[] = [];
  if (memberId) {
    conditions.push(Prisma.sql`tl.member_id = ${memberId}::uuid`);
  }
  if (startDate) {
    conditions.push(Prisma.sql`tl.log_date >= ${startDate}::date`);
  }
  if (endDate) {
    conditions.push(Prisma.sql`tl.log_date <= ${endDate}::date`);
  }

  const whereClause = conditions.length > 0
    ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
    : Prisma.sql``;

  // These five reads are independent — fire them concurrently instead of
  // awaiting one at a time to cut dashboard latency roughly 5x.
  const [tasksCountGroup, logAggregate, projectHoursRaw, totalProjects, totalMembers] = await Promise.all([
    prisma.task.groupBy({
      by: ['status'],
      where: taskWhere,
      _count: {
        id: true,
      }
    }),
    prisma.timeLog.aggregate({
      where: logWhere,
      _sum: {
        hours_logged: true,
        billing_hours: true
      }
    }),
    prisma.$queryRaw<{ id: string; name: string; category: string | null; hours: unknown }[]>(Prisma.sql`
      SELECT
        p.id,
        p.name,
        p.category,
        COALESCE(SUM(tl.hours_logged), 0)::numeric as hours
      FROM time_logs tl
      JOIN tasks t ON tl.task_id = t.id
      JOIN projects p ON t.project_id = p.id
      ${whereClause}
      GROUP BY p.id, p.name, p.category
      ORDER BY hours DESC
    `),
    prisma.project.count(),
    prisma.teamMember.count(),
  ]);

  let totalActive = 0;
  const statusCounts = [
    { status: 'Todo', count: 0 },
    { status: 'Working', count: 0 },
    { status: 'On Review', count: 0 },
    { status: 'Complete', count: 0 }
  ];
  const countMap = new Map<string, number>();
  tasksCountGroup.forEach(g => {
    countMap.set(g.status, g._count.id);
    if (g.status !== 'Complete') {
      totalActive += g._count.id;
    }
  });
  statusCounts.forEach(s => {
    s.count = countMap.get(s.status) || 0;
  });

  const totalWorkingHours = logAggregate._sum.hours_logged || 0;
  const totalBillingHours = logAggregate._sum.billing_hours || 0;

  const projectHours = projectHoursRaw.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category || 'Internal',
    hours: Number(p.hours)
  }));

  const result = {
    totalActiveTasks: totalActive,
    statusCounts,
    totalWorkingHours: Number(totalWorkingHours),
    totalBillingHours: Number(totalBillingHours),
    projectHours,
    totalProjects,
    totalMembers
  };

  cache.set(cacheKey, result, CACHE_TTL);
  return result;
}

export async function getProjectsStats() {
  const cacheKey = 'projects-stats';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const projectStatsRaw = await prisma.$queryRaw<{ id: string; working_hours: unknown; billing_hours: unknown; task_count: unknown }[]>(Prisma.sql`
    SELECT 
      p.id,
      COALESCE(SUM(tl.hours_logged), 0)::numeric as working_hours,
      COALESCE(SUM(tl.billing_hours), 0)::numeric as billing_hours,
      (SELECT COUNT(t2.id)::int FROM tasks t2 WHERE t2.project_id = p.id) as task_count
    FROM projects p
    LEFT JOIN tasks t ON t.project_id = p.id
    LEFT JOIN time_logs tl ON tl.task_id = t.id
    GROUP BY p.id
  `);

  const result: Record<string, { working: number, billing: number, taskCount: number }> = {};
  projectStatsRaw.forEach(row => {
    result[row.id] = {
      working: Number(row.working_hours),
      billing: Number(row.billing_hours),
      taskCount: Number(row.task_count)
    };
  });
  
  cache.set(cacheKey, result, CACHE_TTL);
  return result;
}
