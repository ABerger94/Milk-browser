/*
 * Sports — Capitals schedule, verified Oct 7, 2026.
 * Static seed, clearly dated, plus real scores links.
 */
import Widget from '../../shared/Widget';

const GAMES = [
  { date: 'Tonight 7:30 PM', title: 'vs Pittsburgh Penguins', note: 'Home opener · Capital One Arena', hot: true },
  { date: 'Fri 7:00 PM', title: 'vs New York Rangers', note: 'Capital One Arena' },
  { date: 'Sun 5:00 PM', title: 'vs Seattle Kraken', note: 'Capital One Arena' },
  { date: 'Wed 7:30 PM', title: 'vs Montreal Canadiens', note: 'Capital One Arena' },
];

const LINKS = [
  { name: 'NHL.com Capitals', url: 'https://www.nhl.com/capitals' },
  { name: 'ESPN NHL scores', url: 'https://www.espn.com/nhl/scoreboard' },
];

export default function Sports() {
  const milk = window.milk;
  const open = (url) => {
    if (milk?.tabs) milk.tabs.create(url).catch(() => window.open(url, '_blank'));
    else window.open(url, '_blank');
  };

  return (
    <Widget title="Capitals" icon="🏒">
      <div className="mb-1 text-[11px] text-zinc-600">2026–27 schedule · as of Oct 7, 2026</div>
      <ul className="space-y-1.5">
        {GAMES.map((g, i) => (
          <li
            key={i}
            className={`flex items-baseline gap-2 rounded-lg px-2 py-1 text-sm ${
              g.hot ? 'border border-rose-400/30 bg-rose-400/10' : ''
            }`}
          >
            <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-zinc-300">
              {g.date}
            </span>
            <span className="min-w-0">
              <span className="font-medium text-zinc-200">{g.title}</span>
              <span className="text-zinc-500"> · {g.note}</span>
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-2">
        {LINKS.map((l) => (
          <button
            key={l.name}
            onClick={() => open(l.url)}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-zinc-300 hover:border-rose-400/50 hover:bg-rose-400/10"
          >
            {l.name} ↗
          </button>
        ))}
      </div>
    </Widget>
  );
}
