import { prisma } from '../../config/prisma.js';
import type { Prisma } from '@prisma/client';
import { serialize } from '../../utils/serialize.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  taskScopeWhere,
  assignmentScopeWhere,
  memberScopeFilter,
  isMemberInScope,
  type Actor,
} from '../../utils/scope.js';

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
  /**
   * The authenticated caller. Restricts results to the people they may see
   * (see utils/scope.ts). Admin/super-admin are unrestricted.
   */
  actor?: Actor;
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
  // Team scoping is applied here rather than at the route so every caller of
  // list() inherits it — a Lead must never receive another Lead's tasks.
  // Resolved as a nested filter in this same query, not a preceding lookup.
  const scopeWhere = taskScopeWhere(f.actor);
  const baseWhere = buildWhere(f);
  const where: Prisma.TaskWhereInput = scopeWhere
    ? { AND: [baseWhere, scopeWhere] }
    : baseWhere;

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
    // Both reads are read-only; run them concurrently instead of wrapping the
    // pair in a serial transaction (which adds BEGIN/COMMIT round trips, holds
    // a pooled connection for both queries, and executes them one after the
    // other). Same result, roughly half the latency on the hot 8s poll path.
    const [rows, count] = await Promise.all([
      prisma.task.findMany(query),
      prisma.task.count({ where }),
    ]);
    return { data: serialize(rows), count };
  }

  const rows = await prisma.task.findMany(query);
  return serialize(rows);
}

// Single round-trip payload for the board page.
//
// The board previously issued five requests across three sequential waves on
// every 8s poll: task-assignments(member) -> tasks(ids) -> {time-logs,
// documents, task-assignments(taskIds)}. This collapses that into one request.
//
// Deliberately does *selection* only, never interpretation: the caller passes
// the very same date filters it already computed, and all bucketing/date
// comparison stays on the client. Task.log_date is a bare @db.Date (UTC
// midnight) and the board renders it through toLocaleDateString('en-CA') in the
// *browser's* timezone — moving that math here would silently shift days for
// any user whose timezone is behind UTC. So the client keeps it.
export interface BoardBundleFilter extends TaskListFilter {
  /** Absent = the "all members" central board; set = that member's board. */
  memberId?: string;
}

const PROJECT_SELECT = { select: { id: true, name: true, category: true } } as const;

export async function boardBundle(f: BoardBundleFilter) {
  // One query. The database lives in us-east-1 while users are not, so a
  // round trip costs far more than the rows do — the win here is eliminating
  // sequential trips, not shrinking payloads. Every relation the board needs
  // (project, assignees, time logs, reference doc) hangs off Task, so Prisma
  // can resolve the whole graph in a single pipelined call instead of the
  // five separate requests the client used to chain.
  // Team scoping. On the "All Members" central board this keeps a Lead's view
  // to their own team; on a single-member board the requested member must also
  // be in scope, so the memberId parameter can't be used to read another
  // Lead's people. Both are folded into this one query's filters rather than
  // resolved by a preceding lookup.
  const memberScope = memberScopeFilter(f.actor);
  const scopeWhere = taskScopeWhere(f.actor);
  const baseWhere = buildWhere(f);

  const and: Prisma.TaskWhereInput[] = [baseWhere];
  if (scopeWhere) and.push(scopeWhere);
  // Member board: scope to tasks this member is assigned to. Replaces the old
  // "fetch their assignments, then re-query tasks by id" pair. Requiring the
  // same assignment row to match both the requested member and the caller's
  // scope means an out-of-team memberId simply matches nothing.
  if (f.memberId) {
    and.push({
      assignments: {
        some: memberScope
          ? { AND: [{ member_id: f.memberId }, { member: memberScope }] }
          : { member_id: f.memberId },
      },
    });
  }

  const rows = await prisma.task.findMany({
    where: and.length === 1 ? baseWhere : { AND: and },
    orderBy: buildOrder(f),
    include: {
      project: PROJECT_SELECT,
      // A task can be shared across teams: it stays visible because one of the
      // caller's own people is on it, but the other team's assignees and their
      // logged hours must not come along with it. Filtered in-query rather
      // than discarded in JS afterwards, so the rows never leave the database.
      assignments: { where: assignmentScopeWhere(f.actor) },
      reference_doc: true,
      // Deliberately NOT filtered here: has_logged_time below is a task-wide
      // fact (it drives the completed-task lock, which must not weaken just
      // because the viewer can't see whose hours they were). The rows are
      // narrowed to the caller's scope in the loop instead, using the member's
      // managed_by_id selected alongside.
      time_logs: { include: { member: { select: { id: true, managed_by_id: true } } } },
    },
  });

  // Flatten the graph back into the flat arrays the board already consumes, so
  // no client-side interpretation changes.
  const tasks: unknown[] = [];
  const assignments: unknown[] = [];
  const memberAssignments: unknown[] = [];
  const timeLogs: unknown[] = [];
  const documentsById = new Map<string, unknown>();

  for (const row of rows) {
    const { assignments: rowAssignments, time_logs, reference_doc, ...task } = row;

    // Whether *any* time was ever booked against this task, independent of the
    // board's current day/month window. The client's own total_logged_hours is
    // scoped to that window, so it can read 0 for a task completed last month
    // that does have logged time — not a safe basis for the completed-task
    // lock. This flag is the authoritative one.
    const hasLoggedTime = time_logs.some(
      (l) => Number(l.hours_logged) > 0 || Number(l.billing_hours) > 0,
    );

    tasks.push({ ...task, has_logged_time: hasLoggedTime });

    // Already narrowed to the caller's scope by the include filters above.
    for (const a of rowAssignments) {
      assignments.push(a);
      if (f.memberId && a.member_id === f.memberId) memberAssignments.push(a);
    }

    // The board reads log.task.project.id when tallying which projects were
    // touched, so re-attach the parent the nested shape dropped. Rows with no
    // member belong to nobody and stay visible, matching the previous filter.
    for (const log of time_logs) {
      const { member, ...plain } = log;
      if (log.member_id && !isMemberInScope(f.actor, member)) continue;
      timeLogs.push({ ...plain, task: { ...task, project: row.project } });
    }

    if (reference_doc) documentsById.set(reference_doc.id, reference_doc);
  }

  // Match the ordering the standalone endpoints returned.
  assignments.sort(cmpAssignment);
  memberAssignments.sort(cmpAssignment);
  timeLogs.sort((a, b) => ((a as { id: string }).id < (b as { id: string }).id ? -1 : 1));

  return {
    tasks: serialize(tasks),
    memberAssignments: serialize(memberAssignments),
    assignments: serialize(assignments),
    timeLogs: serialize(timeLogs),
    documents: serialize([...documentsById.values()]),
  };
}

function cmpAssignment(a: unknown, b: unknown) {
  const x = a as { task_id: string; member_id: string };
  const y = b as { task_id: string; member_id: string };
  if (x.task_id !== y.task_id) return x.task_id < y.task_id ? -1 : 1;
  return x.member_id < y.member_id ? -1 : x.member_id > y.member_id ? 1 : 0;
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
  // Status-change guards. Both only apply when the status actually changes, so
  // no-op sends (and edits to other fields) still pass. One query serves both
  // checks — the database is remote and round trips are the expensive part.
  // Hoisted so the sole-assignee sync below (after the write) can reuse it
  // instead of a second round trip.
  let existing: {
    status: string;
    assignments: { member_id: string; status: string }[];
    time_logs: { member_id: string | null; hours_logged: unknown; billing_hours: unknown }[];
  } | null = null;

  if (patch.status !== undefined) {
    existing = await prisma.task.findUnique({
      where: { id },
      select: {
        status: true,
        assignments: { select: { member_id: true, status: true } },
        time_logs: { select: { member_id: true, hours_logged: true, billing_hours: true } },
      },
    });

    const mine = currentUser
      ? existing?.assignments.find((a) => a.member_id === currentUser.sub)
      : undefined;
    const currentStatus = mine?.status ?? existing?.status;

    if (existing && patch.status !== currentStatus) {
      const logs = existing.time_logs;
      const isLogged = (t: { hours_logged: unknown; billing_hours: unknown }) =>
        Number(t.hours_logged) > 0 || Number(t.billing_hours) > 0;

      // A completed task that has booked time is frozen for everyone, matching
      // the same rule deleteTask() already enforces: once the hours are on the
      // record, the status they were logged against must not shift underneath.
      const isCompleted =
        existing.status === 'Complete' || existing.assignments.some((a) => a.status === 'Complete');
      if (isCompleted && logs.some(isLogged)) {
        throw ApiError.forbidden(
          'This task is Completed with logged time and can no longer be moved.',
        );
      }

      // Members are additionally locked once they personally log time.
      if (
        currentUser?.role === 'Member' &&
        logs.some((t) => t.member_id === currentUser.sub && isLogged(t))
      ) {
        throw ApiError.forbidden('You cannot change the status after logging time for this task.');
      }
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

  // Single-assignee tasks: the one assignee's status and the task's "global"
  // status are the same fact viewed from two places (their own board vs. the
  // Central/All-Members board). Nothing else has a claim on what the status
  // "really" is, so keep them identical — otherwise the central board can
  // show e.g. Working on a card while that same task's sole assignee has it
  // marked Complete on their own board. Multi-assignee tasks are left alone:
  // which of several people's status should override the shared one is a
  // real judgment call, not a bug, so that stays whatever the central board
  // was explicitly set to (mirrored the other direction in taskAssignments
  // .service.ts's updateStatus()).
  const soleAssigneeId =
    patch.status !== undefined && existing?.assignments.length === 1
      ? existing.assignments[0].member_id
      : null;

  const task = soleAssigneeId
    ? (
        await prisma.$transaction([
          prisma.task.update({ where: { id }, data }),
          prisma.taskAssignment.updateMany({
            where: { task_id: id, member_id: soleAssigneeId },
            data: { status: patch.status },
          }),
        ])
      )[0]
    : await prisma.task.update({ where: { id }, data });

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
