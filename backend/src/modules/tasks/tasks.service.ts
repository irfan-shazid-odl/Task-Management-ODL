import { prisma } from '../../config/prisma.js';
import type { Prisma } from '@prisma/client';
import { serialize } from '../../utils/serialize.js';
import { ApiError } from '../../utils/ApiError.js';

const CARRY_STATUSES = ['Todo', 'Working', 'On Review'];

export interface TaskListFilter {
  projectId?: string;
  ids?: string[];
  status?: string[];
  logDate?: string;
  logDateLt?: string;
  logDateLte?: string;
  logDateGte?: string;
  createdFrom?: string;
  createdTo?: string;
  boardDate?: string; // with carryOver → (log_date == boardDate) OR (log_date < boardDate AND status carry)
  carryOver?: boolean;
  orderBy?: 'created_at' | 'deadline' | 'id';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  includeProject?: boolean;
  includeReferenceDoc?: boolean;
  withCount?: boolean;
}

function buildWhere(f: TaskListFilter): Prisma.TaskWhereInput {
  const and: Prisma.TaskWhereInput[] = [];

  if (f.projectId) and.push({ project_id: f.projectId });
  if (f.ids) and.push({ id: { in: f.ids } });
  if (f.status) and.push({ status: { in: f.status } });

  if (f.boardDate && f.carryOver) {
    and.push({
      OR: [
        { log_date: new Date(f.boardDate) },
        { log_date: { lt: new Date(f.boardDate) }, status: { in: CARRY_STATUSES } },
      ],
    });
  }

  if (f.logDate) and.push({ log_date: new Date(f.logDate) });
  const logRange: Prisma.DateTimeFilter = {};
  if (f.logDateLt) logRange.lt = new Date(f.logDateLt);
  if (f.logDateLte) logRange.lte = new Date(f.logDateLte);
  if (f.logDateGte) logRange.gte = new Date(f.logDateGte);
  if (Object.keys(logRange).length) and.push({ log_date: logRange });

  const createdRange: Prisma.DateTimeFilter = {};
  if (f.createdFrom) createdRange.gte = new Date(f.createdFrom);
  if (f.createdTo) createdRange.lte = new Date(f.createdTo);
  if (Object.keys(createdRange).length) and.push({ created_at: createdRange });

  return and.length ? { AND: and } : {};
}

function buildOrder(f: TaskListFilter): Prisma.TaskOrderByWithRelationInput {
  const dir = f.order ?? 'desc';
  if (f.orderBy === 'deadline') return { deadline: { sort: dir, nulls: 'last' } };
  if (f.orderBy === 'id') return { id: f.order ?? 'asc' };
  return { created_at: dir };
}

export async function list(f: TaskListFilter) {
  const where = buildWhere(f);
  const include: Prisma.TaskInclude = {
    ...(f.includeProject
      ? { project: { select: { id: true, name: true, category: true } } }
      : {}),
    ...(f.includeReferenceDoc ? { reference_doc: true } : {}),
  };

  const query: Prisma.TaskFindManyArgs = {
    where,
    orderBy: buildOrder(f),
    ...(Object.keys(include).length ? { include } : {}),
    ...(f.limit !== undefined ? { take: f.limit } : {}),
    ...(f.offset !== undefined ? { skip: f.offset } : {}),
  };

  if (f.withCount) {
    const [rows, count] = await prisma.$transaction([
      prisma.task.findMany(query),
      prisma.task.count({ where }),
    ]);
    return { data: serialize(rows), count };
  }

  const rows = await prisma.task.findMany(query);
  return serialize(rows);
}

export interface TaskData {
  project_id?: string | null;
  description: string;
  status?: string;
  priority?: string;
  deadline?: string | null;
  reference_doc_id?: string | null;
  category?: string | null;
  estimated_time?: number | null;
  log_date?: string;
}

// A member "owns" the logged time once they logged any non-zero hours/billing
// hours on a task. Used to lock status changes for Members after time is logged.
export async function hasLoggedTimeForMember(taskId: string, memberId: string): Promise<boolean> {
  const log = await prisma.timeLog.findFirst({
    where: {
      task_id: taskId,
      member_id: memberId,
      OR: [
        { hours_logged: { gt: 0 } },
        { billing_hours: { gt: 0 } },
      ],
    },
    select: { id: true },
  });
  return log !== null;
}

function toTaskCreate(d: TaskData): Prisma.TaskUncheckedCreateInput {
  return {
    project_id: d.project_id ?? null,
    description: d.description,
    ...(d.status ? { status: d.status } : {}),
    ...(d.priority ? { priority: d.priority } : {}),
    deadline: d.deadline ? new Date(d.deadline) : null,
    reference_doc_id: d.reference_doc_id ?? null,
    category: d.category ?? null,
    estimated_time: d.estimated_time ?? null,
    ...(d.log_date ? { log_date: new Date(d.log_date) } : {}),
  };
}

// T1: create task + optional assignees + optional zero-hour anchor log, atomically.
export async function createTask(input: {
  task: TaskData;
  assigneeIds?: string[];
  anchor?: { member_id: string | null; log_date: string } | null;
}) {
  return prisma.$transaction(async (tx) => {
    const task = await tx.task.create({ data: toTaskCreate(input.task) });

    if (input.assigneeIds && input.assigneeIds.length) {
      // Per-assignment status defaults to 'Todo' in the schema, so a task
      // created with an initial status of e.g. 'Working' would still show up
      // on each assignee's board under Todo unless we carry that status over
      // here explicitly.
      await tx.taskAssignment.createMany({
        data: input.assigneeIds.map((member_id) => ({
          task_id: task.id,
          member_id,
          status: input.task.status || 'Todo',
        })),
        skipDuplicates: true,
      });
    }

    if (input.anchor) {
      await tx.timeLog.create({
        data: {
          task_id: task.id,
          member_id: input.anchor.member_id,
          hours_logged: 0,
          billing_hours: 0,
          log_date: new Date(input.anchor.log_date),
        },
      });
    }

    return serialize(task);
  });
}

// Partial field update (status, description, log_date, or full edit-form payload).
export async function updateTask(
  id: string,
  patch: Partial<TaskData>,
  currentUser?: { sub: string; role?: string },
) {
  // Once a Member has logged time on a task they can no longer change its
  // status (no-op status sends still pass). Leads, Admins and super-admin are
  // unaffected.
  if (currentUser?.role === 'Member' && patch.status !== undefined) {
    const existing = await prisma.task.findUnique({
      where: { id },
      select: {
        status: true,
        assignments: { where: { member_id: currentUser.sub }, select: { status: true } },
      },
    });
    const currentStatus = existing?.assignments[0]?.status ?? existing?.status;
    if (patch.status !== currentStatus && (await hasLoggedTimeForMember(id, currentUser.sub))) {
      throw ApiError.forbidden('You cannot change the status after logging time for this task.');
    }
  }

  const data: Prisma.TaskUncheckedUpdateInput = {
    ...(patch.description !== undefined ? { description: patch.description } : {}),
    ...(patch.status !== undefined ? { status: patch.status } : {}),
    ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
    ...(patch.project_id !== undefined ? { project_id: patch.project_id } : {}),
    ...(patch.deadline !== undefined ? { deadline: patch.deadline ? new Date(patch.deadline) : null } : {}),
    ...(patch.reference_doc_id !== undefined ? { reference_doc_id: patch.reference_doc_id } : {}),
    ...(patch.category !== undefined ? { category: patch.category } : {}),
    ...(patch.estimated_time !== undefined ? { estimated_time: patch.estimated_time } : {}),
    ...(patch.log_date !== undefined ? { log_date: patch.log_date ? new Date(patch.log_date) : undefined } : {}),
  };
  const task = await prisma.task.update({ where: { id }, data });
  return serialize(task);
}

export async function deleteTask(
  id: string,
  currentUser?: { sub: string; role?: string },
) {
  const task = await prisma.task.findUnique({
    where: { id },
    select: {
      status: true,
      assignments: { select: { member_id: true, status: true } },
      time_logs: { select: { hours_logged: true, billing_hours: true } },
    },
  });
  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  // Members may only delete tasks on their own board (tasks they are assigned
  // to). Leads, Admins and super-admin can delete any task.
  if (currentUser?.role === 'Member') {
    const isOwn = task.assignments.some((a) => a.member_id === currentUser.sub);
    if (!isOwn) {
      throw ApiError.forbidden('Members can only delete their own tasks.');
    }
  }

  const isCompleted =
    task.status === 'Complete' ||
    task.assignments.some((a) => a.status === 'Complete');
  const hasLoggedTime = task.time_logs.some(
    (t) => Number(t.hours_logged) > 0 || Number(t.billing_hours) > 0
  );
  if (isCompleted && hasLoggedTime) {
    throw ApiError.forbidden(
      'This task is Completed with logged time and can no longer be deleted.'
    );
  }

  await prisma.task.delete({ where: { id } });
  return { ok: true };
}
