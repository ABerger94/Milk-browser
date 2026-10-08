/*
 * "Right Now" bar — clock, date, the single most urgent item,
 * and one-tap checkoffs for today's key routines.
 */
import { useEffect, useState } from 'react';
import { useMilkData, markRoutineDone } from '../../shared/useMilkData';
import { todayKey, formatCountdown, formatTime } from '../../shared/utils';

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function computeUrgent(jobs, money, agenda) {
  const now = new Date();
  const today = todayKey();

  // 1. Interview within the next 72 hours beats everything.
  const upcoming = (jobs?.jobs || [])
    .filter((j) => j.interviewDate)
    .map((j) => ({ j, at: new Date(j.interviewDate) }))
    .filter(({ at }) => at > new Date(now.getTime() - 3600000)) // keep if not long past
    .sort((a, b) => a.at - b.at)[0];
  if (upcoming && upcoming.at - now < 72 * 3600000) {
    return {
      tone: 'amber',
      label: 'Upcoming interview',
      text: `${upcoming.j.company} — ${upcoming.j.role}`,
      sub: `${formatCountdown(upcoming.at)} · ${upcoming.j.location || ''}`,
    };
  }

  // 2. Overdue bills.
  const overdue = (money?.bills || []).filter((b) => b.status === 'overdue');
  if (overdue.length) {
    const total = overdue.reduce((s, b) => s + (b.amount || 0), 0);
    return {
      tone: 'rose',
      label: 'Overdue bills',
      text: `${overdue.map((b) => b.name).join(', ')} — $${total}`,
      sub: 'Delinquency risk. Handle soon.',
    };
  }

  // 3. Next event today.
  const todays = (agenda?.events || [])
    .filter((e) => e.date === today)
    .map((e) => {
      const [h, m] = String(e.time || '00:00').split(':').map(Number);
      const at = new Date(now);
      at.setHours(h, m, 0, 0);
      return { e, at };
    })
    .filter(({ at }) => at >= new Date(now.getTime() - 3600000))
    .sort((a, b) => a.at - b.at)[0];
  if (todays) {
    return {
      tone: 'sky',
      label: "Today's next",
      text: todays.e.title,
      sub: `${formatTime(todays.at)}${todays.e.location ? ' · ' + todays.e.location : ''}`,
    };
  }

  return { tone: 'emerald', label: 'All clear', text: 'Nothing urgent right now.', sub: 'Nice.' };
}

const toneStyles = {
  amber: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
  rose: 'border-rose-400/30 bg-rose-400/10 text-rose-200',
  sky: 'border-sky-400/30 bg-sky-400/10 text-sky-200',
  emerald: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
};

export default function RightNow() {
  const now = useNow();
  const [jobs] = useMilkData('jobs', { jobs: [] }, 'jobs');
  const [money] = useMilkData('money', { bills: [] }, 'money');
  const [agenda] = useMilkData('agenda', { events: [] }, 'agenda');
  const [routines, saveRoutines] = useMilkData('routines', { routines: [] }, 'routines');

  const urgent = computeUrgent(jobs, money, agenda);
  const today = todayKey();
  const doneToday = (id) => (routines?.routines || []).find((r) => r.id === id)?.completions?.includes(today);

  const toggle = async (id) => {
    if (doneToday(id)) return; // one-tap checkoff; unchecking lives in the Routines widget
    await markRoutineDone(id);
  };

  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = formatTime(now);

  const quick = [
    { id: 'meds', label: 'Meds' },
    { id: 'tank-feed', label: 'Tank fed' },
  ];

  return (
    <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-900/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.35)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-4xl font-bold tabular-nums tracking-tight">{timeStr}</div>
          <div className="mt-1 text-sm text-zinc-400">{dateStr}</div>
        </div>

        <div className={`max-w-md flex-1 rounded-xl border px-4 py-3 ${toneStyles[urgent.tone]}`}>
          <div className="text-[11px] font-semibold uppercase tracking-widest opacity-70">{urgent.label}</div>
          <div className="mt-0.5 font-medium">{urgent.text}</div>
          {urgent.sub && <div className="text-sm opacity-75">{urgent.sub}</div>}
        </div>

        <div className="flex gap-2">
          {quick.map((q) => {
            const done = doneToday(q.id);
            return (
              <button
                key={q.id}
                onClick={() => toggle(q.id)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                  done
                    ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-200'
                    : 'border-white/15 bg-white/5 text-zinc-200 hover:border-amber-400/50 hover:bg-amber-400/10'
                }`}
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs ${
                  done ? 'border-emerald-400 bg-emerald-400 text-zinc-950' : 'border-zinc-500'
                }`}>
                  {done ? '✓' : ''}
                </span>
                {q.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
