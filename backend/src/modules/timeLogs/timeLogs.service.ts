import { prisma } from '../../config/prisma.js';
import type { Prisma } from '@prisma/client';
import { serialize } from '../../utils/serialize.js';
import { visibleMemberIds, type Actor } from '../../utils/scope.js';

interface ListFilter {
  taskIds?: string[];
  memberId?: string;
  logDateGte?: string;
  logDateLte?: string;
  includeTaskProject?: boolean;
  /** Authenticated caller; restricts results to their team (utils/scope.ts). */
  actor?: Actor;
}

export async function list(filter: ListFilter) {
  // Hours booked by people outside the caller's team never come back, so a
  // Lead's /reports totals only ever add up their own team's work.
  const scopeIds = filter.actor ? await visibleMemberIds(filter.actor) : null;

  // As in taskAssignments.list(): intersect an explicit member_id with the
  // scope rather than letting it overwrite the restriction.
  let memberWhere: { member_id?: string | { in: string[] } } = {};
  if (filter.memberId) {
    if (scopeIds && !scopeIds.includes(filter.memberId)) return [];
    memberWhere = { member_id: filter.memberId };
  } else if (scopeIds) {
    memberWhere = { member_id: { in: scopeIds } };
  }

  const where: Prisma.TimeLogWhereInput = {
    ...(filter.taskIds ? { task_id: { in: filter.taskIds } } : {}),
    ...memberWhere,
    ...(filter.logDateGte || filter.logDateLte
      ? {
          log_date: {
            ...(filter.logDateGte ? { gte: new Date(filter.logDateGte) } : {}),
            ...(filter.logDateLte ? { lte: new Date(filter.logDateLte) } : {}),
          },
        }
      : {}),
  };

  const rows = await prisma.timeLog.findMany({
    where,
    orderBy: { id: 'asc' },
    include: filter.includeTaskProject
      ? { task: { include: { project: { select: { id: true, name: true, category: true } } } } }
      : undefined,
  });
  return serialize(rows);
}

// Latest log row for a task (used by the frontend's date-rebasing logic).
export async function latestForTask(taskId: string) {
  const row = await prisma.timeLog.findFirst({
    where: { task_id: taskId },
    orderBy: { log_date: 'desc' },
    select: { id: true, log_date: true },
  });
  return row ? serialize(row) : null;
}

interface CreateInput {
  task_id: string;
  member_id?: string | null;
  hours_logged: number;
  billing_hours?: number;
  log_date: string;
}

export async function create(input: CreateInput) {
  const row = await prisma.timeLog.create({
    data: {
      task_id: input.task_id,
      member_id: input.member_id ?? null,
      hours_logged: input.hours_logged,
      billing_hours: input.billing_hours ?? 0,
      log_date: new Date(input.log_date),
    },
  });
  return serialize(row);
}

export async function update(id: string, input: { log_date?: string; hours_logged?: number; billing_hours?: number }) {
  const row = await prisma.timeLog.update({
    where: { id },
    data: {
      ...(input.log_date !== undefined ? { log_date: new Date(input.log_date) } : {}),
      ...(input.hours_logged !== undefined ? { hours_logged: input.hours_logged } : {}),
      ...(input.billing_hours !== undefined ? { billing_hours: input.billing_hours } : {}),
    },
  });
  return serialize(row);
}
