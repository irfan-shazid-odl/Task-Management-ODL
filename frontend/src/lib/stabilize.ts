// Reference-stabilize derived row lists across polls.
//
// The board page first proved this pattern in useBoardState: when the 8s poll
// returns the same data, reusing the *previous* object (and, when everything is
// unchanged in the same order, the previous *array*) lets memoized children
// skip re-rendering entirely. The values and ordering are identical — only
// object/array identity is preserved — so this is behavior-equivalent, just
// cheaper. This splits the same technique into a reusable helper for the
// admin-tasks and projects pages, which had been re-deriving fresh arrays (and
// fresh task objects) on every poll.

interface Indexed<T> {
  sig: string;
  row: T;
}

interface RowIndex<T> {
  current?: Map<string, Indexed<T>>;
  last?: T[];
}

/**
 * Returns `next`, reusing the prior object for any item whose JSON signature
 * is unchanged, and reusing the prior array when every item is unchanged in
 * the same order — so memoized consumers of the returned array don't
 * re-render when nothing actually changed. `state` persists the previous index
 * between calls (pass the same object every time).
 */
export function stabilizeRows<T extends { id: string }>(
  next: T[],
  state: RowIndex<T>,
  sigFn: (row: T) => string,
): T[] {
  const prev = state.current ?? new Map<string, Indexed<T>>();
  const fresh = new Map<string, Indexed<T>>();
  const out = new Array<T>(next.length);

  for (let i = 0; i < next.length; i++) {
    const row = next[i];
    const sig = sigFn(row);
    const old = prev.get(row.id);
    if (old && old.sig === sig) {
      fresh.set(row.id, old);
      out[i] = old.row;
    } else {
      fresh.set(row.id, { sig, row });
      out[i] = row;
    }
  }

  state.current = fresh;

  // If every element is the same object in the same order, hand back the exact
  // previous array so React bails out of the whole-block render.
  const last = state.last;
  let same = (last?.length ?? 0) === out.length;
  if (same) {
    for (let i = 0; i < out.length; i++) {
      if (last![i] !== out[i]) { same = false; break; }
    }
  }
  const result = same && last ? last : out;
  state.last = result;
  return result;
}

/**
 * Reference-stabilize a flat string→value map the same way stabilizeRows
 * stabilizes an array: if the serialized contents are unchanged, reuse the
 * previous object so consumers keyed on object identity don't re-render.
 * `state` persists the previous value between calls.
 */
export function stabilizeRecord<V>(
  next: Record<string, V>,
  state: { current?: Record<string, V>; sig?: string },
): Record<string, V> {
  const sig = JSON.stringify(
    Object.keys(next)
      .sort()
      .map((k) => `${k}:${JSON.stringify(next[k])}`),
  );
  if (state.sig === sig && state.current) return state.current;
  state.sig = sig;
  state.current = next;
  return next;
}
