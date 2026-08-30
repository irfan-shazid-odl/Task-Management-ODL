import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { cache } from '../../utils/cache.js';
import { memberScopeFilter, memberScopeSql, scopeCacheKey, type Actor } from '../../utils/scope.js';

const CACHE_TTL = 120_000; // 2 minutes

export async function getDashboardStats(
  memberId?: string,
  startDate?: string,
  endDate?: string,
  actor?: Actor,
) {
  // Restrict every aggregate below to the people this caller may see, so a
  // Lead's totals never include another Lead's team. Expressed as filters, so
  // none of this costs an extra round trip to resolve the team first.
  const memberScope = memberScopeFilter(actor);

  // The scope MUST be part of the cache key. Without it, two Leads share one
  // entry and whichever misses first serves its team's numbers to the other —
  // turning the cache itself into the leak. (role, sub) identifies the scope
  // exactly, so the key needs no member lookup either.
  const cacheKey = `dashboard-stats-${scopeCacheKey(actor)}-${memberId || 'all'}-${startDate || 'none'}-${endDate || 'none'}`;

  return cache.getOrCompute(cacheKey, CACHE_TTL, async () => {
    // An explicit memberId is intersected with the scope, never merged over
    // it: requiring one assignment row to satisfy both means an out-of-team
    // memberId simply matches nothing.
    const assignmentScope: Prisma.TaskAssignmentWhereInput | undefined =
      memberId && memberScope
        ? { AND: [{ member_id: memberId }, { member: memberScope }] }
        : memberId
          ? { member_id: memberId }
          : memberScope
            ? { member: memberScope }
            : undefined;

    const taskWhere: Prisma.TaskWhereInput = {};
    if (assignmentScope) taskWhere.assignments = { some: assignmentScope };
    if (startDate || endDate) {
      taskWhere.created_at = {};
      if (startDate) taskWhere.created_at.gte = new Date(startDate + 'T00:00:00Z');
      if (endDate) taskWhere.created_at.lte = new Date(endDate + 'T23:59:59Z');
    }

    const logWhere: Prisma.TimeLogWhereInput = {};
    if (memberId) logWhere.member_id = memberId;
    if (memberScope) logWhere.member = memberScope;
    if (startDate || endDate) {
      logWhere.log_date = {};
      if (startDate) logWhere.log_date.gte = new Date(startDate);
      if (endDate) logWhere.log_date.lte = new Date(endDate);
    }

    const conditions: Prisma.Sql[] = [];
    if (memberId) {
      conditions.push(Prisma.sql`tl.member_id = ${memberId}::uuid`);
    }
    const scopeSql = memberScopeSql(Prisma.sql`tl.member_id`, actor);
    if (scopeSql) conditions.push(scopeSql);
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
      // Runs inside the existing Promise.all, so it adds no extra wall time.
      prisma.teamMember.count({ where: memberScope }),
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
  //
  // Scope belongs in the cache key — otherwise the first Lead to miss the
  // cache populates it with their team's numbers for everyone else.
  const cacheKey = `projects-stats-${scopeCacheKey(actor)}`;

  return cache.getOrCompute(cacheKey, CACHE_TTL, async () => {
    // Restricts the hour sums to the caller's people, and the task count to
    // tasks at least one of them is assigned to. Both are SQL subqueries on
    // team_members rather than an inlined id list, so the team never has to be
    // fetched first. Unscoped callers (Admin+) get the plain org-wide totals
    // exactly as before.
    const tlScope = memberScopeSql(Prisma.sql`tl.member_id`, actor);
    const taScope = memberScopeSql(Prisma.sql`ta.member_id`, actor);
    const logScope = tlScope ? Prisma.sql`AND ${tlScope}` : Prisma.sql``;
    const taskScope = taScope
      ? Prisma.sql`WHERE EXISTS (
          SELECT 1 FROM task_assignments ta
          WHERE ta.task_id = tasks.id AND ${taScope}
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
