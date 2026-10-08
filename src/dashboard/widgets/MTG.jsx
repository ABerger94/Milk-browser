/*
 * MTG Pulse — upcoming releases and events, verified Oct 7, 2026.
 * Static seed (no live API in v1), clearly dated, plus real resource links.
 */
import Widget from '../../shared/Widget';

const UPCOMING = [
  { date: 'Oct 12', title: 'Secret Lair: Corn Maze Superdrop', note: 'Drop series release' },
  { date: 'Oct 12', title: 'B&R update', note: 'Banned & restricted announcement' },
  { date: 'Oct 13', title: 'Alchemy: Reality Fracture', note: 'MTG Arena release' },
  { date: 'Oct 19', title: 'Mystery Booster: Commander Edition', note: 'Festival in a Box · MagicCon Atlanta' },
  { date: 'Oct 23', title: 'Reality Fracture Secret Lair Bundle', note: 'Bundle release' },
  { date: 'Nov 13', title: 'Star Trek (Universes Beyond)', note: 'Standard-legal set · 4 Commander decks' },
  { date: 'Nov 13–15', title: 'MagicCon Atlanta', note: 'World Championship 32 · Nauctis preview' },
];

const LINKS = [
  { name: 'Scryfall', url: 'https://scryfall.com' },
  { name: 'EDHREC', url: 'https://edhrec.com' },
  { name: 'MTG Wiki: upcoming events', url: 'https://mtg.wiki/page/Template:Upcoming_events' },
];

export default function MTG() {
  const milk = window.milk;
  const open = (url) => {
    if (milk?.tabs) milk.tabs.create(url).catch(() => window.open(url, '_blank'));
    else window.open(url, '_blank');
  };

  return (
    <Widget title="MTG Pulse" icon="🃏">
      <div className="mb-1 text-[11px] text-zinc-600">Upcoming — verified Oct 7, 2026</div>
      <ul className="space-y-1.5">
        {UPCOMING.map((u, i) => (
          <li key={i} className="flex items-baseline gap-2 text-sm">
            <span className="shrink-0 rounded bg-violet-400/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-violet-300">
              {u.date}
            </span>
            <span className="min-w-0">
              <span className="font-medium text-zinc-200">{u.title}</span>
              <span className="text-zinc-500"> · {u.note}</span>
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-2">
        {LINKS.map((l) => (
          <button
            key={l.name}
            onClick={() => open(l.url)}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-zinc-300 hover:border-violet-400/50 hover:bg-violet-400/10"
          >
            {l.name} ↗
          </button>
        ))}
      </div>
    </Widget>
  );
}
