/*
 * Routines — daily/weekly/monthly habits with streaks.
 * "Mark done" writes today's date into completions in routines.json.
 */
import Widget from '../../shared/Widget';
import { useMilkData, markRoutineDone } from '../../shared/useMilkData';
import { todayKey, computeStreak } from '../../shared/utils';

function scheduleText(r) {
  if (r.schedule === 'daily') return `Daily${r.time ? ' · ' + r.time : ''}`;
  if (r.schedule === 'weekly') return `Weekly · ${r.weekday || ''}${r.time ? ' ' + r.time : ''}`;
  if (r.schedule === 'monthly') return `Monthly · day ${r.monthday || 1}${r.time ? ' ' + r.time : ''}`;
  return r.schedule;
}

export default function Routines() {
  const [data] = useMilkData('routines', { routines: [] }, 'routines');
  const routines = data?.routines || [];
  const today = todayKey();

  return (
    <Widget title="Routines" icon="🔁">
      <div className="space-y-2">
        {routines.length === 0 && (
          <p className="py-4 text-center text-sm text-zinc-500">No routines tracked.</p>
        )}
        {routines.map((r) => {
          const done = (r.completions || []).includes(today);
          const streak = computeStreak(r.completions, r.schedule);
          return (
            <div
              key={r.id}
              className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                done ? 'border-emerald-400/30 bg-emerald-400/[0.07]' : 'border-white/10 bg-white/[0.03]'
              }`}
            >
              <button
                onClick={() => { if (!done) markRoutineDone(r.id); }}
                title={done ? 'Done today' : 'Mark done'}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm transition-all ${
                  done
                    ? 'border-emerald-400 bg-emerald-400 text-zinc-950'
                    : 'border-zinc-600 hover:border-amber-400 hover:bg-amber-400/10'
                }`}
              >
                {done ? '✓' : ''}
              </button>
              <div className="min-w-0 flex-1">
                <div className={`text-sm font-medium ${done ? 'text-zinc-400' : 'text-zinc-100'}`}>
                  {r.name}
                </div>
                <div className="text-xs text-zinc-500">{scheduleText(r)}</div>
                {r.description && <div className="truncate text-xs text-zinc-600">{r.description}</div>}
              </div>
              {streak > 0 && (
                <div className="shrink-0 rounded-lg bg-amber-400/15 px-2.5 py-1 text-center">
                  <div className="text-sm font-bold text-amber-300">🔥{streak}</div>
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                    {r.schedule === 'daily' ? 'days' : r.schedule === 'weekly' ? 'wks' : 'mos'}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Widget>
  );
}
