import { prisma } from '../../config/prisma.js';
import { serialize } from '../../utils/serialize.js';
import { ApiError } from '../../utils/ApiError.js';
import { hasLoggedTimeForMember } from '../tasks/tasks.service.js';

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
  // Once a Member has logged time on the task they can no longer change its
  // status. Leads, Admins and super-admin are unaffected.
  if (currentUser?.role === 'Member') {
    const row = await prisma.taskAssignment.findUnique({
      where: { task_id_member_id: { task_id: taskId, member_id: memberId } },
      select: { status: true },
    });
    if (status !== row?.status && (await hasLoggedTimeForMember(taskId, memberId))) {
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
