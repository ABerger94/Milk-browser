/*
 * Job Hunt HQ — pipeline, follow-up radar, interview countdowns.
 * Writes back to jobs.json (add application, update status).
 */
import { useEffect, useState } from 'react';
import Widget from '../../shared/Widget';
import { useMilkData } from '../../shared/useMilkData';
import { todayKey, daysBetween, formatCountdown, bus } from '../../shared/utils';

const STAGES = [
  { id: 'applied', label: 'Applied' },
  { id: 'interviewing', label: 'Interviewing' },
  { id: 'waiting', label: 'Waiting to hear' },
  { id: 'offer', label: 'Offer' },
];

const EMPTY_JOB = {
  company: '',
  role: '',
  status: 'applied',
  appliedDate: todayKey(),
  location: '',
  contact: '',
  phone: '',
  notes: '',
  lastActivity: todayKey(),
};

function InterviewCard({ job }) {
  // Re-render every 30s so the countdown stays fresh.
  const [, forceTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => forceTick((x) => x + 1), 30000);
    return () => clearInterval(t);
  }, []);
  const at = new Date(job.interviewDate);
  const valid = !isNaN(at);
  return (
    <div className="mb-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-amber-300">
        Interview {valid ? formatCountdown(at) : ''}
      </div>
      <div className="mt-1 text-lg font-bold">{job.company}</div>
      <div className="text-sm text-zinc-300">{job.role}</div>
      <div className="mt-2 space-y-1 text-sm text-zinc-400">
        {valid && (
          <div>📅 {at.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at{' '}
            {at.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>
        )}
        {job.location && <div>📍 {job.location}</div>}
        {job.contact && <div>👤 {job.contact}{job.phone ? ` · ${job.phone}` : ''}</div>}
        {job.notes && <div className="text-zinc-500">📝 {job.notes}</div>}
      </div>
    </div>
  );
}

function AddModal({ onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_JOB);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const valid = form.company.trim() && form.role.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-lg font-bold">Add application</h3>
        <div className="space-y-3">
          {[
            ['company', 'Company *'],
            ['role', 'Role *'],
            ['location', 'Location'],
            ['contact', 'Contact name'],
            ['phone', 'Contact phone'],
            ['notes', 'Notes'],
          ].map(([k, label]) => (
            <label key={k} className="block">
              <span className="mb-1 block text-xs uppercase tracking-wider text-zinc-500">{label}</span>
              <input
                value={form[k]}
                onChange={set(k)}
                className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-amber-400/50"
              />
            </label>
          ))}
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wider text-zinc-500">Stage</span>
            <select
              value={form.status}
              onChange={set('status')}
              className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none"
            >
              {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:bg-white/10">Cancel</button>
          <button
            disabled={!valid}
            onClick={() => onSave({ ...form, id: 'job-' + Date.now() })}
            className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-40 hover:bg-amber-300"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Jobs() {
  const [data, save, loaded] = useMilkData('jobs', { jobs: [] }, 'jobs');
  const [showAdd, setShowAdd] = useState(false);
  const [detail, setDetail] = useState(null);

  // Opened from Quick Actions / palette.
  useEffect(() => bus.on('jobs:open-add', () => setShowAdd(true)), []);

  const jobs = data?.jobs || [];
  const today = todayKey();

  const saveJob = (job) => {
    save({ jobs: [...jobs, job] });
    setShowAdd(false);
  };

  const cycleStatus = (job) => {
    const order = STAGES.map((s) => s.id);
    const next = order[(order.indexOf(job.status) + 1) % order.length];
    save({ jobs: jobs.map((j) => (j.id === job.id ? { ...j, status: next, lastActivity: today } : j)) });
  };

  const radar = jobs
    .filter((j) => j.status !== 'interviewing' && j.status !== 'offer')
    .map((j) => ({ j, idle: daysBetween(j.lastActivity || j.appliedDate || today, today) }))
    .filter(({ idle }) => idle >= 4)
    .sort((a, b) => b.idle - a.idle);

  const interviews = jobs.filter((j) => j.interviewDate && new Date(j.interviewDate) > new Date(Date.now() - 86400000));

  return (
    <Widget
      title="Job Hunt HQ"
      icon="💼"
      action={
        <button
          onClick={() => setShowAdd(true)}
          className="rounded-lg bg-amber-400/15 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-400/25"
        >
          + Add
        </button>
      }
    >
      {interviews.map((j) => <InterviewCard key={j.id} job={j} />)}

      {radar.length > 0 && (
        <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
            Follow-up radar
          </div>
          {radar.map(({ j, idle }) => (
            <div key={j.id} className="flex items-center justify-between py-1 text-sm">
              <span className="text-zinc-300">
                <span className="font-medium text-zinc-100">{j.company}</span>
                <span className="text-zinc-500"> — {idle}d silent</span>
              </span>
              <span className="text-xs text-amber-300">nudge {j.contact || 'them'}</span>
            </div>
          ))}
        </div>
      )}

      {!loaded ? (
        <p className="py-4 text-center text-sm text-zinc-600">Loading…</p>
      ) : jobs.length === 0 ? (
        <p className="py-4 text-center text-sm text-zinc-500">No applications tracked yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
          {STAGES.map((stage) => {
            const list = jobs.filter((j) => j.status === stage.id);
            return (
              <div key={stage.id} className="rounded-xl bg-white/[0.03] p-2">
                <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                  {stage.label} <span className="text-zinc-600">({list.length})</span>
                </div>
                <div className="space-y-2">
                  {list.map((j) => {
                    const idle = daysBetween(j.lastActivity || j.appliedDate || today, today);
                    return (
                      <button
                        key={j.id}
                        onClick={() => setDetail(detail === j.id ? null : j.id)}
                        className="w-full rounded-lg border border-white/10 bg-zinc-900 p-2.5 text-left hover:border-amber-400/40"
                      >
                        <div className="truncate text-sm font-semibold">{j.company}</div>
                        <div className="truncate text-xs text-zinc-500">{j.role}</div>
                        <div className="mt-1 text-[11px] text-zinc-600">{idle === 0 ? 'active today' : `${idle}d ago`}</div>
                        {detail === j.id && (
                          <div className="mt-2 space-y-1 border-t border-white/10 pt-2 text-xs text-zinc-400" onClick={(e) => e.stopPropagation()}>
                            {j.contact && <div>👤 {j.contact}{j.phone ? ` · ${j.phone}` : ''}</div>}
                            {j.location && <div>📍 {j.location}</div>}
                            {j.notes && <div>📝 {j.notes}</div>}
                            <button
                              onClick={() => cycleStatus(j)}
                              className="mt-1 rounded bg-white/10 px-2 py-1 text-[11px] text-zinc-200 hover:bg-white/20"
                            >
                              Move to next stage →
                            </button>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && <AddModal onClose={() => setShowAdd(false)} onSave={saveJob} />}
    </Widget>
  );
}
