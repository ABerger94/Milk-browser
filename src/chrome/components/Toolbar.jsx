/* Toolbar: nav buttons, address bar, window controls. */
import { useEffect, useRef, useState } from 'react';

function displayUrl(url) {
  if (!url) return '';
  if (url.includes('dashboard.html')) return 'milk://newtab';
  return url;
}

export default function Toolbar({ active, onChanged, onPalette }) {
  const milk = window.milk;
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [maxed, setMaxed] = useState(false);
  const inputRef = useRef(null);

  // Keep the address bar in sync with the active tab when not editing.
  useEffect(() => {
    if (!focused) setValue(displayUrl(active?.url));
  }, [active?.url, active?.id, focused]);

  useEffect(() => {
    if (!milk) return;
    milk.win.isMaximized().then(setMaxed).catch(() => {});
    milk.onMaxChanged(() => milk.win.isMaximized().then(setMaxed).catch(() => {}));
    milk.onFocusAddress(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, []);

  const go = () => {
    if (active && value.trim()) {
      milk?.tabs.navigate(active.id, value.trim()).then(onChanged).catch(() => {});
      inputRef.current?.blur();
    }
  };

  const btn =
    'nodrag flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/10 hover:text-zinc-100 disabled:opacity-30';

  return (
    <div className="drag flex h-14 items-center gap-1 bg-zinc-900 px-3">
      <button className={btn} disabled={!active?.canGoBack} title="Back"
        onClick={() => active && milk?.tabs.back(active.id)}>←</button>
      <button className={btn} disabled={!active?.canGoForward} title="Forward"
        onClick={() => active && milk?.tabs.forward(active.id)}>→</button>
      <button className={btn} title="Reload (Ctrl+R)"
        onClick={() => active && milk?.tabs.reload(active.id).then(onChanged)}>⟳</button>

      <div className="nodrag mx-1 flex h-10 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-zinc-950 px-3 focus-within:border-amber-400/50">
        <span className="text-zinc-500">🥛</span>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => { if (e.key === 'Enter') go(); }}
          placeholder="Search DuckDuckGo or type a URL"
          spellCheck={false}
          className="h-full flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
        />
        <button
          onClick={onPalette}
          className="rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-white/10 hover:text-zinc-200"
          title="Command palette (Ctrl+K)"
        >
          ⌘K
        </button>
      </div>

      <div className="nodrag flex items-center">
        <button className={btn} title="Minimize" onClick={() => milk?.win.minimize()}>−</button>
        <button className={btn} title={maxed ? 'Restore' : 'Maximize'} onClick={() => milk?.win.toggleMax()}>
          {maxed ? '❐' : '□'}
        </button>
        <button className={`${btn} hover:!bg-rose-600 hover:!text-white`} title="Close"
          onClick={() => milk?.win.close()}>×</button>
      </div>
    </div>
  );
}
