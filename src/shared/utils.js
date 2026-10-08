/*
 * Shared date / streak / urgency helpers used by the dashboard widgets.
 * Everything works in the user's local timezone.
 */

export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(key, n) {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return todayKey(dt);
}

export function daysBetween(aKey, bKey) {
  const [ay, am, ad] = aKey.split('-').map(Number);
  const [by, bm, bd] = bKey.split('-').map(Number);
  const a = new Date(ay, am - 1, ad);
  const b = new Date(by, bm - 1, bd);
  return Math.round((b - a) / 86400000);
}

/** Parse a "YYYY-MM-DD" + "HH:MM" pair into a local Date. */
export function localDateTime(dateKey, timeStr) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const [hh, mm] = String(timeStr || '00:00').split(':').map(Number);
  return new Date(y, m - 1, d, hh || 0, mm || 0);
}

/**
 * Consecutive-period streak from a list of completion date keys.
 * daily   -> consecutive days ending today (or yesterday, streak still alive)
 * weekly  -> consecutive weeks with at least one completion
 * monthly -> consecutive months with at least one completion
 */
export function computeStreak(completions, schedule) {
  if (!completions || !completions.length) return 0;
  const set = new Set(completions);
  const today = todayKey();

  if (schedule === 'daily') {
    let streak = 0;
    let cursor = today;
    if (!set.has(cursor)) cursor = addDays(cursor, -1); // done yesterday counts as alive
    while (set.has(cursor)) {
      streak += 1;
      cursor = addDays(cursor, -1);
    }
    return streak;
  }

  if (schedule === 'weekly') {
    // bucket completions by ISO week key
    const weekKey = (key) => {
      const [y, m, d] = key.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      const onejan = new Date(dt.getFullYear(), 0, 1);
      const week = Math.ceil(((dt - onejan) / 86400000 + onejan.getDay() + 1) / 7);
      return `${dt.getFullYear()}-W${week}`;
    };
    const weeks = new Set([...set].map(weekKey));
    const cur = new Date();
    let streak = 0;
    // walk back week by week; allow the current week to be empty (still in it)
    let probe = new Date(cur);
    const wk = (dt) => {
      const onejan = new Date(dt.getFullYear(), 0, 1);
      const week = Math.ceil(((dt - onejan) / 86400000 + onejan.getDay() + 1) / 7);
      return `${dt.getFullYear()}-W${week}`;
    };
    if (!weeks.has(wk(probe))) probe.setDate(probe.getDate() - 7);
    while (weeks.has(wk(probe))) {
      streak += 1;
      probe.setDate(probe.getDate() - 7);
    }
    return streak;
  }

  if (schedule === 'monthly') {
    const months = new Set([...set].map((k) => k.slice(0, 7)));
    const now = new Date();
    let y = now.getFullYear();
    let m = now.getMonth();
    const key = () => `${y}-${String(m + 1).padStart(2, '0')}`;
    if (!months.has(key())) {
      m -= 1;
      if (m < 0) { m = 11; y -= 1; }
    }
    let streak = 0;
    while (months.has(key())) {
      streak += 1;
      m -= 1;
      if (m < 0) { m = 11; y -= 1; }
    }
    return streak;
  }

  return 0;
}

/** "in 2d 4h", "in 3h 12m", "in 25m", "now", or "2h ago" for past times. */
export function formatCountdown(target) {
  const ms = target - new Date();
  if (ms <= 0) {
    const mins = Math.round(-ms / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
  }
  const mins = Math.floor(ms / 60000);
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (d > 0) return `in ${d}d ${h}h`;
  if (h > 0) return `in ${h}h ${m}m`;
  return `in ${m}m`;
}

export function formatTime(date) {
  let h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, '0');
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ap}`;
}

/* Tiny event bus so widgets can tell each other "data changed, re-read". */
const listeners = new Map();
export const bus = {
  on(evt, fn) {
    if (!listeners.has(evt)) listeners.set(evt, new Set());
    listeners.get(evt).add(fn);
    return () => listeners.get(evt).delete(fn);
  },
  emit(evt) {
    (listeners.get(evt) || []).forEach((fn) => {
      try { fn(); } catch { /* never break the emitter */ }
    });
  },
};
