/*
 * Milk Browser dashboard — the new-tab command center.
 * Every widget reads/writes local JSON in ../data via useMilkData.
 */
import RightNow from './widgets/RightNow';
import Agenda from './widgets/Agenda';
import Jobs from './widgets/Jobs';
import Money from './widgets/Money';
import Routines from './widgets/Routines';
import QuickActions from './widgets/QuickActions';
import MTG from './widgets/MTG';
import Sports from './widgets/Sports';

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-[1600px] px-6 py-6">
        <RightNow />
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
          <div className="xl:col-span-4"><Agenda /></div>
          <div className="md:col-span-2 xl:col-span-5"><Jobs /></div>
          <div className="xl:col-span-3"><Money /></div>
          <div className="xl:col-span-4"><Routines /></div>
          <div className="xl:col-span-4"><QuickActions /></div>
          <div className="flex flex-col gap-4 xl:col-span-4">
            <MTG />
            <Sports />
          </div>
        </div>
        <footer className="mt-8 flex items-center justify-between text-xs text-zinc-600">
          <span>🥛 Milk Browser — your data never leaves this machine</span>
          <span>Ctrl+K for commands · Ctrl+T new tab · Ctrl+W close tab</span>
        </footer>
      </div>
    </div>
  );
}
