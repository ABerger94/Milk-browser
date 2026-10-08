/*
 * Money — bills due, what's owed to him, expected income. Just the numbers.
 * "Mark paid" writes back to money.json.
 */
import Widget from '../../shared/Widget';
import { useMilkData } from '../../shared/useMilkData';

function money(n) {
  return n == null ? '—' : '$' + Number(n).toLocaleString();
}

export default function Money() {
  const [data, save] = useMilkData('money', { bills: [], owedToHim: [], expectedIncome: [] }, 'money');

  const bills = data?.bills || [];
  const owed = data?.owedToHim || [];
  const expected = data?.expectedIncome || [];

  const dueTotal = bills.filter((b) => b.status !== 'paid').reduce((s, b) => s + (b.amount || 0), 0);
  const owedTotal = owed.reduce((s, o) => s + (o.amount || 0), 0);

  const markPaid = (id) => {
    save({
      ...data,
      bills: bills.map((b) => (b.id === id ? { ...b, status: 'paid' } : b)),
    });
  };

  const Row = ({ name, amount, note, status, onPaid }) => (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <div className="min-w-0">
        <div className={`truncate text-sm font-medium ${status === 'paid' ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}>
          {name}
        </div>
        {note && <div className="truncate text-xs text-zinc-500">{note}</div>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className={`text-sm font-semibold tabular-nums ${status === 'overdue' ? 'text-rose-300' : 'text-zinc-200'}`}>
          {money(amount)}
        </span>
        {status === 'overdue' && (
          <span className="rounded bg-rose-400/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-rose-300">
            overdue
          </span>
        )}
        {onPaid && status !== 'paid' && (
          <button
            onClick={onPaid}
            className="rounded bg-emerald-400/15 px-2 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-400/25"
          >
            paid
          </button>
        )}
      </div>
    </div>
  );

  return (
    <Widget title="Money" icon="💵">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Bills</div>
      <div className="divide-y divide-white/5">
        {bills.length === 0 && <p className="py-2 text-sm text-zinc-500">No bills tracked.</p>}
        {bills.map((b) => (
          <Row key={b.id} name={b.name} amount={b.amount} note={b.due ? `Due ${b.due}${b.note ? ' · ' + b.note : ''}` : b.note} status={b.status} onPaid={() => markPaid(b.id)} />
        ))}
      </div>

      {owed.length > 0 && (
        <>
          <div className="mb-1 mt-4 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
            Owed to you
          </div>
          <div className="divide-y divide-white/5">
            {owed.map((o) => (
              <Row key={o.id} name={o.name} amount={o.amount} note={o.note} status="owed" />
            ))}
          </div>
        </>
      )}

      {expected.length > 0 && (
        <>
          <div className="mb-1 mt-4 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
            Expected income
          </div>
          <div className="divide-y divide-white/5">
            {expected.map((e) => (
              <Row key={e.id} name={e.name} amount={e.amount} note={e.note} status="expected" />
            ))}
          </div>
        </>
      )}

      <div className="mt-4 flex justify-between rounded-xl bg-white/[0.03] px-3 py-2 text-sm">
        <span className="text-zinc-500">Due total</span>
        <span className="font-bold tabular-nums text-rose-300">${dueTotal.toLocaleString()}</span>
      </div>
      {owedTotal > 0 && (
        <div className="mt-1 flex justify-between rounded-xl bg-white/[0.03] px-3 py-2 text-sm">
          <span className="text-zinc-500">Owed to you</span>
          <span className="font-bold tabular-nums text-emerald-300">${owedTotal.toLocaleString()}</span>
        </div>
      )}
    </Widget>
  );
}
