/*
 * Today's Agenda — one chronological timeline merging calendar events,
 * routines due today, overdue bills, and job follow-ups due.
 */
import Widget from '../../shared/Widget';
import { useMilkData } from '../../shared/useMilkData';
import { todayKey, localDateTime, formatTime, daysBetween } from '../../shared/utils';

function routineDueToday(r, today) {
  if (r.schedule === 'daily') return true;
  if (r.schedule === 'weekly') {
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return weekdays[new Date().getDay()] === r.weekday;
  }
  if (r.schedule === 'monthly') {
    return new Date().getDate() === r.monthday;
  }
  return false;
}

export default function Agenda() {
  const [agenda] = useMilkData('agenda', { events: [] }, 'agenda');
  const [routines] = useMilkData('routines', { routines: [] }, 'routines');
  const [money] = useMilkData('money', { bills: [] }, 'money');
  const [jobs] = useMilkData('jobs', { jobs: [] }, 'jobs');

  const today = todayKey();
  const now = new Date();
  const items = [];

  // Events today
  for (const e of agenda?.events || []) {
    if (e.date !== today) continue;
    const at = localDateTime(e.date, e.time);
    items.push({
      time: at,
      kind: 'event',
      title: e.title,
      sub: [e.location, e.notes].filter(Boolean).join(' · '),
      past: at < now,
    });
  }

  // Routines due today
  for (const r of routines?.routines || []) {
    if (!routineDueToday(r, today)) continue;
    const done = (r.completions || []).includes(today);
    const at = localDateTime(today, r.time);
    items.push({
      time: at,
      kind: 'routine',
      title: r.name,
      sub: r.time ? `Due ~${r.time}` : r.schedule,
      past: done,
      done,
    });
  }

  // Overdue bills (no fixed time — float them to the top as all-day)
  for (const b of money?.bills || []) {
    if (b.status !== 'overdue') continue;
    items.push({
      time: null,
      kind: 'bill',
      title: `${b.name} — $${b.amount} overdue`,
      sub: b.note || '',
      past: false,
      urgent: true,
    });
  }

  // Job follow-ups due (4+ days since last activity, not interviewing)
  for (const j of jobs?.jobs || []) {
    if (j.status === 'interviewing' || j.status === 'offer') continue;
    const idle = daysBetween(j.lastActivity || j.appliedDate || today, today);
    if (idle >= 4) {
      items.push({
        time: null,
        kind: 'followup',
        title: `Nudge ${j.company}`,
        sub: `${idle} days since last activity · ${j.contact || 'no contact listed'}`,
        past: false,
      });
    }
  }

  items.sort((a, b) => {
    if (!a.time && !b.time) return 0;
    if (!a.time) return -1;
    if (!b.time) return 1;
    return a.time - b.time;
  });

  const kindStyle = {
    event: 'bg-sky-400/20 text-sky-300',
    routine: 'bg-emerald-400/20 text-emerald-300',
    bill: 'bg-rose-400/20 text-rose-300',
    followup: 'bg-amber-400/20 text-amber-300',
  };
  const kindLabel = { event: 'event', routine: 'routine', bill: 'bill', followup: 'follow-up' };

  return (
    <Widget title="Today's Agenda" icon="📅">
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-zinc-500">
          Nothing on the books today. Enjoy the quiet.
        </p>
      ) : (
        <ol className="relative space-y-1 border-l border-white/10 pl-0">
          {items.map((it, i) => (
            <li key={i} className="relative flex gap-3 py-2 pl-5">
              <span
                className={`absolute -left-[5px] top-4 h-2.5 w-2.5 rounded-full ${
                  it.urgent ? 'bg-rose-400' : it.past && !it.done ? 'bg-zinc-600' : 'bg-amber-400'
                }`}
              />
              <div className={`min-w-[86px] pt-0.5 text-xs tabular-nums ${it.past && !it.done ? 'text-zinc-600' : 'text-zinc-400'}`}>
                {it.time ? formatTime(it.time) : 'anytime'}
              </div>
              <div className="min-w-0 flex-1">
                <div className={`flex items-center gap-2 ${it.past && !it.done ? 'text-zinc-500' : 'text-zinc-100'}`}>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${kindStyle[it.kind]}`}>
                    {kindLabel[it.kind]}
                  </span>
                  <span className={`truncate text-sm font-medium ${it.done ? 'line-through opacity-60' : ''}`}>
                    {it.title}
                  </span>
                  {it.done && <span className="text-xs text-emerald-400">✓ done</span>}
                </div>
                {it.sub && <div className="truncate text-xs text-zinc-500">{it.sub}</div>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </Widget>
  );
}
