import { prisma } from '../../config/prisma.js';
import { serialize } from '../../utils/serialize.js';
import { ApiError } from '../../utils/ApiError.js';

interface ListFilter {
  taskIds?: string[];
  memberId?: string;
}

export async function list(filter: ListFilter) {
  const rows = await prisma.taskAssignment.findMany({
    where: {
      ...(filter.taskIds ? { task_id: { in: filter.taskIds } } : {}),
      ...(filter.memberId ? { member_id: filter.memberId } : {}),
    },
    orderBy: [{ task_id: 'asc' }, { member_id: 'asc' }],
  });
  return serialize(rows);
}

export async function assign(taskId: string, memberId: string) {
  const row = await prisma.taskAssignment.upsert({
    where: { task_id_member_id: { task_id: taskId, member_id: memberId } },
    create: { task_id: taskId, member_id: memberId },
    update: {},
  });
  return serialize(row);
}

export async function unassign(taskId: string, memberId: string) {
  await prisma.taskAssignment.deleteMany({ where: { task_id: taskId, member_id: memberId } });
  return { ok: true };
}

export async function updateStatus(
  taskId: string,
  memberId: string,
  status: string,
  currentUser?: { sub: string; role?: string },
) {
  // Status-change guards for this member's own board column. Both only fire on
  // a real change, and share a single query since the database is remote.
  const existing = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      assignments: { where: { member_id: memberId }, select: { status: true } },
      time_logs: { select: { member_id: true, hours_logged: true, billing_hours: true } },
    },
  });
  const current = existing?.assignments[0]?.status;

  if (existing && status !== current) {
    const isLogged = (t: { hours_logged: unknown; billing_hours: unknown }) =>
      Number(t.hours_logged) > 0 || Number(t.billing_hours) > 0;
    // Scoped to this member's own logged time rather than the task's: on a
    // multi-assignee task one person booking hours must not freeze everyone
    // else's column. Hours are always credited to an assignee, so "they
    // completed it and logged the time" is exactly this condition.
    const loggedByMember = existing.time_logs.some((t) => t.member_id === memberId && isLogged(t));

    // Completed + logged time: frozen for every role.
    if (current === 'Complete' && loggedByMember) {
      throw ApiError.forbidden(
        'This task is Completed with logged time and can no longer be moved.',
      );
    }

    // Members are additionally locked once they log time, at any status.
    if (currentUser?.role === 'Member' && loggedByMember) {
      throw ApiError.forbidden('You cannot change the status after logging time for this task.');
    }
  }

  await prisma.taskAssignment.updateMany({
    where: { task_id: taskId, member_id: memberId },
    data: { status },
  });
  return { ok: true };
}

// Bulk replace all assignees for a task, preserving prior per-assignee status
// where possible. Mirrors the frontend's delete-then-insert flow atomically.
export async function replaceForTask(
  taskId: string,
  assignees: Array<{ member_id: string; status?: string }>,
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.taskAssignment.findMany({ where: { task_id: taskId } });
    const prevStatus = new Map(existing.map((a) => [a.member_id, a.status]));

    await tx.taskAssignment.deleteMany({ where: { task_id: taskId } });

    if (assignees.length > 0) {
      await tx.taskAssignment.createMany({
        data: assignees.map((a) => ({
          task_id: taskId,
          member_id: a.member_id,
          status: a.status ?? prevStatus.get(a.member_id) ?? 'Todo',
        })),
        skipDuplicates: true,
      });
    }
    const rows = await tx.taskAssignment.findMany({ where: { task_id: taskId } });
    return serialize(rows);
  });
}
