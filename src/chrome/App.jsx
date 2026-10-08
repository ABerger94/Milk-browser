/* Top chrome: tab strip + toolbar + command palette. Fixed height (104px). */
import { useCallback, useEffect, useRef, useState } from 'react';
import TabBar from './components/TabBar';
import Toolbar from './components/Toolbar';
import CommandPalette from './components/CommandPalette';

export default function App() {
  const [tabs, setTabs] = useState([]);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    if (!window.milk) return;
    window.milk.tabs.list().then(setTabs).catch(() => {});
    window.milk.onTabs(setTabs);
    window.milk.onOpenPalette(() => setPaletteOpen(true));
  }, []);

  const active = tabs.find((t) => t.active);

  const refresh = useCallback(() => {
    window.milk?.tabs.list().then(setTabs).catch(() => {});
  }, []);

  // Escape closes the palette; also close on tab changes.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setPaletteOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex h-[104px] select-none flex-col bg-zinc-950 text-zinc-100">
      <TabBar tabs={tabs} onChanged={refresh} />
      <Toolbar active={active} onChanged={refresh} onPalette={() => setPaletteOpen(true)} />
      {paletteOpen && (
        <CommandPalette tabs={tabs} active={active} onClose={() => setPaletteOpen(false)} />
      )}
    </div>
  );
}
