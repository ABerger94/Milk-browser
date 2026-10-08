/* Consistent card wrapper for dashboard widgets. */
export default function Widget({ title, icon, action, children, className = '' }) {
  return (
    <section
      className={`rounded-2xl border border-white/10 bg-zinc-900/80 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.35)] backdrop-blur ${className}`}
    >
      <header className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-zinc-400">
          {icon && <span className="text-base">{icon}</span>}
          {title}
        </h2>
        {action}
      </header>
      {children}
    </section>
  );
}
