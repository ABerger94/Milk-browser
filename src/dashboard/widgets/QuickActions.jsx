/*
 * Quick Actions — one-click writes (meds, feeding) plus quick links.
 * "Add job application" opens the Jobs widget's modal via the event bus.
 */
import Widget from '../../shared/Widget';
import { useMilkData, markRoutineDone } from '../../shared/useMilkData';
import { bus } from '../../shared/utils';

export default function QuickActions() {
  const [quicklinks] = useMilkData('quicklinks', { links: [] }, 'quicklinks');
  const milk = window.milk;

  const openUrl = (url) => {
    if (milk?.tabs) milk.tabs.create(url).catch(() => window.open(url, '_blank'));
    else window.open(url, '_blank');
  };

  const actions = [
    { label: 'Log tank feeding', icon: '🐟', run: () => markRoutineDone('tank-feed') },
    { label: 'Mark meds taken', icon: '💊', run: () => markRoutineDone('meds') },
    { label: 'Add job application', icon: '💼', run: () => bus.emit('jobs:open-add') },
  ];

  return (
    <Widget title="Quick Actions" icon="⚡">
      <div className="grid grid-cols-3 gap-2">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={a.run}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-2 py-4 text-center transition-colors hover:border-amber-400/50 hover:bg-amber-400/10"
          >
            <span className="text-2xl">{a.icon}</span>
            <span className="text-xs font-medium text-zinc-300">{a.label}</span>
          </button>
        ))}
      </div>

      <div className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
        Quick links
      </div>
      <div className="grid grid-cols-3 gap-2">
        {(quicklinks?.links || []).map((l) => (
          <button
            key={l.name}
            onClick={() => openUrl(l.url)}
            className="truncate rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:border-sky-400/50 hover:bg-sky-400/10 hover:text-zinc-100"
          >
            {l.name}
          </button>
        ))}
      </div>
    </Widget>
  );
}
