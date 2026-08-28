import { prisma } from '../../config/prisma.js';
import type { Prisma } from '@prisma/client';
import { ApiError } from '../../utils/ApiError.js';
import { serialize } from '../../utils/serialize.js';

interface ListOptions {
  includeLead?: boolean;
  includeClient?: boolean;
  orderBy?: 'sort_order' | 'name' | 'created_at';
  order?: 'asc' | 'desc';
}

export async function list(opts: ListOptions) {
  const include: Prisma.ProjectInclude = {
    ...(opts.includeLead ? { project_lead: true } : {}),
    ...(opts.includeClient ? { client: true } : {}),
  };
  const orderField = opts.orderBy ?? 'sort_order';
  const rows = await prisma.project.findMany({
    ...(Object.keys(include).length ? { include } : {}),
    orderBy: { [orderField]: opts.order ?? (orderField === 'sort_order' ? 'asc' : 'asc') },
  });
  return serialize(rows);
}

export async function count() {
  return { count: await prisma.project.count() };
}

export async function getById(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: { project_lead: true, client: true },
  });
  if (!project) throw ApiError.notFound('Project not found');
  return serialize(project);
}

export interface ProjectData {
  name: string;
  category: string;
  project_lead_id?: string | null;
  client_id?: string | null;
  client_name?: string | null;
  status?: string | null;
  priority?: string | null;
  project_type?: string | null;
  start_date?: string | null;
  brief?: string | null;
  sort_order?: number;
}

function toWrite(d: Partial<ProjectData>): Prisma.ProjectUncheckedCreateInput | Prisma.ProjectUncheckedUpdateInput {
  return {
    ...(d.name !== undefined ? { name: d.name } : {}),
    ...(d.category !== undefined ? { category: d.category } : {}),
    ...(d.project_lead_id !== undefined ? { project_lead_id: d.project_lead_id } : {}),
    ...(d.client_id !== undefined ? { client_id: d.client_id } : {}),
    ...(d.client_name !== undefined ? { client_name: d.client_name } : {}),
    ...(d.status !== undefined ? { status: d.status } : {}),
    ...(d.priority !== undefined ? { priority: d.priority } : {}),
    ...(d.project_type !== undefined ? { project_type: d.project_type } : {}),
    ...(d.start_date !== undefined ? { start_date: d.start_date ? new Date(d.start_date) : null } : {}),
    ...(d.brief !== undefined ? { brief: d.brief } : {}),
    ...(d.sort_order !== undefined ? { sort_order: d.sort_order } : {}),
  };
}

export async function create(data: ProjectData) {
  let sortOrder = data.sort_order;
  if (sortOrder === undefined) {
    const max = await prisma.project.aggregate({ _max: { sort_order: true } });
    sortOrder = (max._max.sort_order ?? 0) + 1;
  }
  const project = await prisma.project.create({
    data: { ...(toWrite(data) as Prisma.ProjectUncheckedCreateInput), sort_order: sortOrder },
  });
  return serialize(project);
}

export async function update(id: string, data: Partial<ProjectData>) {
  const project = await prisma.project.update({ where: { id }, data: toWrite(data) });
  return serialize(project);
}

export async function reorder(updates: Array<{ id: string; sort_order: number }>) {
  await prisma.$transaction(
    updates.map((u) => prisma.project.update({ where: { id: u.id }, data: { sort_order: u.sort_order } })),
  );
  return { ok: true };
}

// Cascade delete relies on FK onDelete rules in the schema (tasks, credentials,
// documents, activity → project; assignments, time_logs → task).
export async function remove(id: string) {
  await prisma.project.delete({ where: { id } });
  return { ok: true };
}

// T5: destructive project-level hours override. Deletes ALL time logs for the
// project's tasks and writes a single aggregate row, mirroring saveProjectMetric.
export async function overrideHours(
  projectId: string,
  input: { hours_logged: number; billing_hours: number; log_date: string },
) {
  return prisma.$transaction(async (tx) => {
    const tasks = await tx.task.findMany({ where: { project_id: projectId }, select: { id: true } });
    const taskIds = tasks.map((t) => t.id);
    if (taskIds.length === 0) return { ok: true, note: 'No tasks for project' };

    await tx.timeLog.deleteMany({ where: { task_id: { in: taskIds } } });

    const firstAssignment = await tx.taskAssignment.findFirst({
      where: { task_id: { in: taskIds } },
      select: { task_id: true, member_id: true },
    });
    const targetTaskId = firstAssignment?.task_id ?? taskIds[0];
    const memberId = firstAssignment?.member_id ?? null;

    await tx.timeLog.create({
      data: {
        task_id: targetTaskId,
        member_id: memberId,
        hours_logged: input.hours_logged,
        billing_hours: input.billing_hours,
        log_date: new Date(input.log_date),
      },
    });
    return { ok: true };
  });
}
