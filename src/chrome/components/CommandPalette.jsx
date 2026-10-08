/* Ctrl+K command palette: tabs, actions, quick data actions, links, go-to. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { markRoutineDone } from '../../shared/useMilkData';

/* Subsequence fuzzy match. Higher score = better. -1 = no match. */
function fuzzy(query, text) {
  query = query.toLowerCase();
  text = text.toLowerCase();
  let qi = 0;
  let score = 0;
  let last = -1;
  for (let ti = 0; ti < text.length && qi < query.length; ti++) {
    if (text[ti] === query[qi]) {
      score += last === ti - 1 ? 2 : 1; // bonus for consecutive runs
      if (ti === 0 || text[ti - 1] === ' ') score += 2; // word-start bonus
      last = ti;
      qi++;
    }
  }
  return qi === query.length ? score : -1;
}

export default function CommandPalette({ tabs, active, onClose }) {
  const milk = window.milk;
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const [links, setLinks] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    milk?.data.get('quicklinks').then((d) => {
      if (d?.links) setLinks(d.links);
    }).catch(() => {});
  }, []);

  const items = useMemo(() => {
    const out = [];
    const query = q.trim();

    // Tabs
    for (const t of tabs) {
      out.push({
        kind: 'tab',
        label: `Switch to: ${t.title || 'New Tab'}`,
        hint: t.active ? 'current' : '',
        score: query ? fuzzy(query, t.title || '') : 1,
        run: () => milk?.tabs.activate(t.id),
      });
    }

    // Browser actions
    const actions = [
      { label: 'New tab', run: () => milk?.tabs.create() },
      { label: 'Close current tab', run: () => active && milk?.tabs.close(active.id) },
      { label: 'Reload page', run: () => active && milk?.tabs.reload(active.id) },
      { label: 'Back', run: () => active && milk?.tabs.back(active.id) },
      { label: 'Forward', run: () => active && milk?.tabs.forward(active.id) },
    ];
    for (const a of actions) {
      out.push({ kind: 'action', label: a.label, score: query ? fuzzy(query, a.label) : 0, run: a.run });
    }

    // Quick data actions (write straight to the JSON store)
    const dataActions = [
      { label: 'Mark medications taken', run: () => markRoutineDone('meds') },
      { label: 'Log tank feeding', run: () => markRoutineDone('tank-feed') },
      { label: 'Open dashboard', run: () => milk?.tabs.create('milk://newtab') },
    ];
    for (const a of dataActions) {
      out.push({ kind: 'data', label: a.label, score: query ? fuzzy(query, a.label) : 0, run: a.run });
    }

    // Quick links
    for (const l of links) {
      out.push({
        kind: 'link',
        label: `Open ${l.name}`,
        hint: l.url,
        score: query ? fuzzy(query, l.name) : 0,
        run: () => milk?.tabs.create(l.url),
      });
    }

    // Go-to: raw URL or search, always available when there's a query
    if (query) {
      out.unshift({
        kind: 'go',
        label: `Go to: ${query}`,
        score: 1000,
        run: () => milk?.tabs.create(query),
      });
    }

    return out.filter((i) => i.score >= 0).sort((a, b) => b.score - a.score).slice(0, 12);
  }, [q, tabs, links, active]);

  useEffect(() => setSel(0), [q]);

  const run = (item) => {
    try { item.run(); } catch { /* ignore */ }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-24 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[640px] overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, items.length - 1)); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
            else if (e.key === 'Enter' && items[sel]) run(items[sel]);
            else if (e.key === 'Escape') onClose();
          }}
          placeholder="Type a command, search tabs, or enter a URL…"
          className="h-14 w-full bg-transparent px-5 text-[15px] text-zinc-100 outline-none placeholder:text-zinc-600"
        />
        <div className="max-h-[380px] overflow-y-auto border-t border-white/10 py-2">
          {items.length === 0 && (
            <div className="px-5 py-6 text-center text-sm text-zinc-500">No matches</div>
          )}
          {items.map((item, i) => (
            <button
              key={i}
              onMouseEnter={() => setSel(i)}
              onClick={() => run(item)}
              className={`flex w-full items-center gap-3 px-5 py-2.5 text-left text-sm ${
                i === sel ? 'bg-amber-400/15 text-zinc-100' : 'text-zinc-300'
              }`}
            >
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                  item.kind === 'tab' ? 'bg-sky-400/20 text-sky-300'
                  : item.kind === 'data' ? 'bg-emerald-400/20 text-emerald-300'
                  : item.kind === 'link' ? 'bg-violet-400/20 text-violet-300'
                  : item.kind === 'go' ? 'bg-amber-400/20 text-amber-300'
                  : 'bg-zinc-700/60 text-zinc-300'
                }`}
              >
                {item.kind}
              </span>
              <span className="flex-1 truncate">{item.label}</span>
              {item.hint && <span className="truncate text-xs text-zinc-500">{item.hint}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
