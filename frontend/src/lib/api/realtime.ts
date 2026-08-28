// Realtime replacement.
//
// The original app used Supabase `postgres_changes` channels to re-fetch data
// when rows changed. With Supabase removed, this provides a same-shaped
// subscribe/unsubscribe helper backed by lightweight polling: the callback
// (typically a data re-fetch) runs on an interval and pauses while the tab is
// hidden. Swap-in for `supabase.channel(...).subscribe()` +
// `supabase.removeChannel(...)`.
//
// If you later want instant updates, replace the internals here with an SSE /
// WebSocket subscription — call sites won't need to change.

interface SubscribeOptions {
  /** Poll interval in ms while the tab is visible. Default 8000. */
  intervalMs?: number;
  /** Run the callback immediately on subscribe. Default false. */
  immediate?: boolean;
}

export type Unsubscribe = () => void;

export function subscribeToChanges(onChange: () => void, options: SubscribeOptions = {}): Unsubscribe {
  const interval = options.intervalMs ?? 8000;
  let timer: ReturnType<typeof setInterval> | null = null;

  const tick = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
    onChange();
  };

  const start = () => {
    if (timer) return;
    timer = setInterval(tick, interval);
  };
  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  const onVisibility = () => {
    if (document.visibilityState === 'visible') {
      onChange(); // catch up immediately when the user returns
      start();
    } else {
      stop();
    }
  };

  if (options.immediate) onChange();
  start();
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibility);
  }

  return () => {
    stop();
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibility);
    }
  };
}
