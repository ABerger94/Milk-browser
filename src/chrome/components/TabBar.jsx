/* Tab strip. The empty area is draggable (frameless window). */
export default function TabBar({ tabs, onChanged }) {
  const milk = window.milk;

  const close = (e, id) => {
    e.stopPropagation();
    milk?.tabs.close(id).then(onChanged).catch(() => {});
  };

  return (
    <div className="drag flex h-10 items-stretch gap-1 bg-zinc-950 px-2 pt-2">
      <div className="flex min-w-0 flex-1 items-stretch gap-1 overflow-x-auto">
        {tabs.map((t) => (
          <div
            key={t.id}
            onClick={() => milk?.tabs.activate(t.id).then(onChanged).catch(() => {})}
            className={`nodrag group flex min-w-[120px] max-w-[220px] flex-1 cursor-pointer items-center gap-2 rounded-t-lg px-3 text-[13px] transition-colors ${
              t.active ? 'bg-zinc-900 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200'
            }`}
            title={t.url}
          >
            <span className="flex-1 truncate">{t.title || 'New Tab'}</span>
            <button
              onClick={(e) => close(e, t.id)}
              className="nodrag rounded-full px-1.5 text-zinc-500 opacity-0 transition-opacity hover:bg-white/10 hover:text-zinc-200 group-hover:opacity-100"
              title="Close tab"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={() => milk?.tabs.create().then(onChanged).catch(() => {})}
        className="nodrag mb-0.5 flex w-8 items-center justify-center rounded-lg text-lg text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
        title="New tab (Ctrl+T)"
      >
        +
      </button>
    </div>
  );
}
