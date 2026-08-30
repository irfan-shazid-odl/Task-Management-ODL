import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { cache } from '../../utils/cache.js';
import { visibleMemberIds, type Actor } from '../../utils/scope.js';

const CACHE_TTL = 120_000; // 2 minutes

const EMPTY_DASHBOARD = {
  totalActiveTasks: 0,
  statusCounts: [
    { status: 'Todo', count: 0 },
    { status: 'Working', count: 0 },
    { status: 'On Review', count: 0 },
    { status: 'Complete', count: 0 },
  ],
  totalWorkingHours: 0,
  totalBillingHours: 0,
  projectHours: [] as { id: string; name: string; category: string; hours: number }[],
  totalProjects: 0,
  totalMembers: 0,
};

export async function getDashboardStats(
  memberId?: string,
  startDate?: string,
  endDate?: string,
  actor?: Actor,
) {
  // Restrict every aggregate below to the people this caller may see, so a
  // Lead's totals never include another Lead's team.
  const scopeIds = actor ? await visibleMemberIds(actor) : null;

  // An explicit memberId is intersected with the scope, never merged over it.
  if (memberId && scopeIds && !scopeIds.includes(memberId)) return EMPTY_DASHBOARD;
  const effectiveMemberIds = memberId ? [memberId] : scopeIds;

  // The scope MUST be part of the cache key. Without it, two Leads share one
  // entry and whichever misses first serves its team's numbers to the other —
  // turning the cache itself into the leak.
  const scopeKey = scopeIds ? `s:${[...scopeIds].sort().join('.')}` : 's:all';
  const cacheKey = `dashboard-stats-${scopeKey}-${memberId || 'all'}-${startDate || 'none'}-${endDate || 'none'}`;

  return cache.getOrCompute(cacheKey, CACHE_TTL, async () => {
    const taskWhere: Prisma.TaskWhereInput = {};
    if (effectiveMemberIds) {
      taskWhere.assignments = { some: { member_id: { in: effectiveMemberIds } } };
    }
    if (startDate || endDate) {
      taskWhere.created_at = {};
      if (startDate) taskWhere.created_at.gte = new Date(startDate + 'T00:00:00Z');
      if (endDate) taskWhere.created_at.lte = new Date(endDate + 'T23:59:59Z');
    }

    const logWhere: Prisma.TimeLogWhereInput = {};
    if (effectiveMemberIds) logWhere.member_id = { in: effectiveMemberIds };
    if (startDate || endDate) {
      logWhere.log_date = {};
      if (startDate) logWhere.log_date.gte = new Date(startDate);
      if (endDate) logWhere.log_date.lte = new Date(endDate);
    }

    const conditions: Prisma.Sql[] = [];
    if (effectiveMemberIds) {
      conditions.push(
        Prisma.sql`tl.member_id IN (${Prisma.join(
          effectiveMemberIds.map((id) => Prisma.sql`${id}::uuid`),
        )})`,
      );
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
      // Headcount is the caller's own team, not the whole org — an unscoped
      // count would tell one Lead how many people every other Lead manages.
      effectiveMemberIds
        ? Promise.resolve(effectiveMemberIds.length)
        : prisma.teamMember.count(),
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

    return {
      totalActiveTasks: totalActive,
      statusCounts,
      totalWorkingHours: Number(totalWorkingHours),
      totalBillingHours: Number(totalBillingHours),
      projectHours,
      totalProjects,
      totalMembers
    };
  });
}

export async function getProjectsStats(actor?: Actor) {
  // The /projects page shows these hour and task counts to Leads, so they must
  // only ever aggregate the caller's own team's work.
  const scopeIds = actor ? await visibleMemberIds(actor) : null;

  // Scope belongs in the cache key — otherwise the first Lead to miss the
  // cache populates it with their team's numbers for everyone else.
  const scopeKey = scopeIds ? `s:${[...scopeIds].sort().join('.')}` : 's:all';
  const cacheKey = `projects-stats-${scopeKey}`;

  return cache.getOrCompute(cacheKey, CACHE_TTL, async () => {
    // Restricts the hour sums to the caller's people, and the task count to
    // tasks at least one of them is assigned to. Unscoped callers (Admin+)
    // get the plain org-wide totals exactly as before.
    const logScope = scopeIds
      ? Prisma.sql`AND tl.member_id IN (${Prisma.join(scopeIds.map((id) => Prisma.sql`${id}::uuid`))})`
      : Prisma.sql``;
    const taskScope = scopeIds
      ? Prisma.sql`WHERE EXISTS (
          SELECT 1 FROM task_assignments ta
          WHERE ta.task_id = tasks.id
            AND ta.member_id IN (${Prisma.join(scopeIds.map((id) => Prisma.sql`${id}::uuid`))})
        )`
      : Prisma.sql``;

    // task_count via a single GROUP BY join instead of a correlated subquery
    // that Postgres would execute once per project row. Identical result: a map
    // of projectId -> { working, billing, taskCount }.
    const projectStatsRaw = await prisma.$queryRaw<{ id: string; working_hours: unknown; billing_hours: unknown; task_count: unknown }[]>(Prisma.sql`
      SELECT
        p.id,
        COALESCE(SUM(tl.hours_logged), 0)::numeric as working_hours,
        COALESCE(SUM(tl.billing_hours), 0)::numeric as billing_hours,
        COALESCE(tc.c, 0)::int as task_count
      FROM projects p
      LEFT JOIN tasks t ON t.project_id = p.id
      LEFT JOIN time_logs tl ON tl.task_id = t.id ${logScope}
      LEFT JOIN (
        SELECT project_id, COUNT(*)::int AS c
        FROM tasks
        ${taskScope}
        GROUP BY project_id
      ) tc ON tc.project_id = p.id
      GROUP BY p.id, tc.c
    `);

    const result: Record<string, { working: number, billing: number, taskCount: number }> = {};
    projectStatsRaw.forEach(row => {
      result[row.id] = {
        working: Number(row.working_hours),
        billing: Number(row.billing_hours),
        taskCount: Number(row.task_count)
      };
    });

    return result;
  });
}
