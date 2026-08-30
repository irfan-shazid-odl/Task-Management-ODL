import { Prisma } from '@prisma/client';

export interface Actor {
  sub: string;
  role?: string;
}

// Who a caller is allowed to see:
//
//   Admin / super-admin -> everyone (no restriction)
//   Lead                -> themselves + every Member they created (managed_by_id)
//   Member              -> themselves only
//
// This is the single source of truth for read scoping on tasks, assignments,
// time logs, activity and stats, so one Lead can never see another Lead's team
// through any endpoint. It lives on the server: the board and reports pages
// send no team parameter of their own, so there is nothing a client could
// tamper with to widen its own scope.
//
// Everything below is expressed as a *filter* rather than a list of member
// ids. Resolving the id list first cost an extra database round trip on every
// scoped request — with the database a continent away that doubled the latency
// of every Lead's board poll (measured 481ms vs 258ms for an unscoped caller,
// against a ~240ms round-trip floor). Because the scope is fully determined by
// (role, sub), it can be expressed as a nested relation filter that the main
// query resolves in the same trip. Same rows, half the latency.

export function isUnscoped(actor?: Actor): boolean {
  return !actor || actor.role === 'Admin' || actor.role === 'super-admin';
}

/** Matches the TeamMembers this caller may see. undefined = no restriction. */
export function memberScopeFilter(actor?: Actor): Prisma.TeamMemberWhereInput | undefined {
  if (isUnscoped(actor)) return undefined;
  if (actor!.role === 'Lead') {
    return { OR: [{ id: actor!.sub }, { managed_by_id: actor!.sub }] };
  }
  return { id: actor!.sub };
}

// A task is in scope when at least one of its assignees is someone the caller
// may see. Tasks with no assignees at all are included too: they belong to no
// team, so showing them leaks nobody's work, and excluding them would make a
// task a Lead just created (before picking an assignee) vanish from their own
// board.
export function taskScopeWhere(actor?: Actor): Prisma.TaskWhereInput | undefined {
  const member = memberScopeFilter(actor);
  if (!member) return undefined;
  return {
    OR: [{ assignments: { some: { member } } }, { assignments: { none: {} } }],
  };
}

/** Matches assignments belonging to someone the caller may see. */
export function assignmentScopeWhere(actor?: Actor): Prisma.TaskAssignmentWhereInput | undefined {
  const member = memberScopeFilter(actor);
  return member ? { member } : undefined;
}

/**
 * Matches time logs booked by someone the caller may see.
 * `includeUnowned` keeps rows with a null member_id (they belong to nobody) —
 * the board bundle keeps them, the standalone /time-logs list does not, and
 * both behaviours are preserved exactly as they shipped.
 */
export function timeLogScopeWhere(
  actor?: Actor,
  includeUnowned = false,
): Prisma.TimeLogWhereInput | undefined {
  const member = memberScopeFilter(actor);
  if (!member) return undefined;
  return includeUnowned ? { OR: [{ member }, { member_id: null }] } : { member };
}

/**
 * In-memory equivalent of memberScopeFilter, for rows already fetched.
 *
 * Used where a relation must stay *unfiltered* in the query for some other
 * reason but its rows still need narrowing before they're returned — the board
 * bundle derives a task's has_logged_time from every time log on the task
 * (task-wide, by design, since it drives the completed-task lock), yet must
 * only hand back the logs the caller may see. Needs the row's own
 * managed_by_id, so callers select it alongside.
 */
export function isMemberInScope(
  actor: Actor | undefined,
  member: { id: string; managed_by_id: string | null } | null | undefined,
): boolean {
  if (isUnscoped(actor)) return true;
  if (!member) return false;
  if (member.id === actor!.sub) return true;
  return actor!.role === 'Lead' && member.managed_by_id === actor!.sub;
}

/**
 * Stable cache-key fragment. The scope is fully determined by (role, sub), so
 * this identifies it exactly without needing to resolve the member list.
 */
export function scopeCacheKey(actor?: Actor): string {
  return isUnscoped(actor) ? 'all' : `${actor!.role}:${actor!.sub}`;
}

/**
 * The same restriction as a SQL fragment, for the raw aggregate queries in
 * stats. Emits a condition on `<alias>.member_id`, or null when unscoped.
 */
export function memberScopeSql(column: Prisma.Sql, actor?: Actor): Prisma.Sql | null {
  if (isUnscoped(actor)) return null;
  if (actor!.role === 'Lead') {
    return Prisma.sql`${column} IN (
      SELECT id FROM team_members WHERE id = ${actor!.sub}::uuid OR managed_by_id = ${actor!.sub}::uuid
    )`;
  }
  return Prisma.sql`${column} = ${actor!.sub}::uuid`;
}
