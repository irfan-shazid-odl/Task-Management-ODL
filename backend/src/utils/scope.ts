import { prisma } from '../config/prisma.js';

export interface Actor {
  sub: string;
  role?: string;
}

// Which people's work a caller is allowed to see.
//
// `null` means "no restriction" — Admin and super-admin see the whole org.
// Everyone else gets an explicit allow-list of member ids:
//
//   Lead    -> themselves + every Member they created (managed_by_id = their id)
//   Member  -> themselves only
//
// This is the single source of truth for read scoping on tasks, assignments
// and time logs, so one Lead can never see another Lead's team through any
// endpoint. It deliberately lives on the server: the board and reports pages
// send no team parameter of their own, so there is nothing a client could
// tamper with to widen its own scope.
export async function visibleMemberIds(actor: Actor): Promise<string[] | null> {
  if (actor.role === 'Admin' || actor.role === 'super-admin') return null;

  if (actor.role === 'Lead') {
    const managed = await prisma.teamMember.findMany({
      where: { managed_by_id: actor.sub },
      select: { id: true },
    });
    return [actor.sub, ...managed.map((m) => m.id)];
  }

  return [actor.sub];
}

// Task-level filter for a given allow-list.
//
// A task is in scope when at least one of its assignees is someone the caller
// may see. Tasks with no assignees at all are included too: they belong to no
// team, so showing them leaks nobody's work, and excluding them would make a
// task a Lead just created (before picking an assignee) vanish from their own
// board.
export function taskScopeWhere(memberIds: string[] | null) {
  if (!memberIds) return undefined;
  return {
    OR: [
      { assignments: { some: { member_id: { in: memberIds } } } },
      { assignments: { none: {} } },
    ],
  };
}
