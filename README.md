# 🥛 Milk Browser

A personal command-center web browser. Chromium up front, your life on the new-tab page.

Every new tab opens a **dashboard** — Right Now bar, today's agenda, job hunt pipeline,
money snapshot, routine tracking with streaks, quick actions, MTG pulse, and Capitals
schedule — all reading and writing local JSON files. No accounts, no cloud, no paid APIs.
Your data never leaves the machine.

## Tech

- **Electron** (main process: window, tabs via `WebContentsView`, ad blocking)
- **React + Vite + Tailwind CSS v4** (two renderer apps: browser chrome + dashboard)
- **Local JSON** in `data/` — the entire "backend"

## Setup

```bash
cd milk-browser
npm install
```

## Run

Build the renderer once, then start Electron:

```bash
npm run build
npm start
```

For development (hot reload on the renderer):

```bash
# terminal 1
npm run dev
# terminal 2 (Windows: set MILK_DEV=1 && npm start)
MILK_DEV=1 npm start
```

`MILK_DEV=1` makes Electron load the renderer from the Vite dev server
(`http://127.0.0.1:5173`) instead of `dist/`.

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+T` | New tab (opens dashboard) |
| `Ctrl+W` | Close tab |
| `Ctrl+K` | Command palette |
| `Ctrl+L` | Focus address bar |
| `Ctrl+R` | Reload page |
| `Esc` | Close palette |

The address bar takes URLs (`example.com`, `https://…`) or plain text, which
searches via DuckDuckGo.

## Data files (`data/`)

All editable by hand or through the dashboard UI — the app reads and writes
these directly:

| File | What |
|---|---|
| `agenda.json` | Calendar-style events (`{ id, title, date, time, endTime, location, notes }`) |
| `jobs.json` | Job applications (`{ id, company, role, status, appliedDate, interviewDate, location, contact, phone, notes, lastActivity }`). Statuses: `applied` → `interviewing` → `waiting` → `offer` |
| `money.json` | `bills` (`{ id, name, amount, due, status, note }`), `owedToHim`, `expectedIncome` |
| `routines.json` | Routines (`{ id, name, schedule: daily/weekly/monthly, time, weekday, monthday, description, completions: ["YYYY-MM-DD"] }`) |
| `quicklinks.json` | Quick-link buttons (`{ name, url }`) |

Marking a routine done appends today's date to its `completions`; streaks are
computed from consecutive days/weeks/months. Marking a bill paid flips its
status. Nothing is ever deleted automatically.

## Project layout

```
electron/
  main.js       main process — window, tab views, IPC, shortcuts
  preload.js    context bridge exposing window.milk (tabs, data, window)
  adblock.js    Ghostery adblocker w/ offline domain-blocklist fallback
src/
  chrome/       top chrome UI — TabBar, Toolbar (address bar), CommandPalette
  dashboard/    new-tab dashboard — App + widgets/
  shared/       useMilkData hook, date/streak utils, Widget card, event bus
data/           seed JSON (your real jobs, bills, routines)
chrome.html     chrome entry point
dashboard.html  dashboard entry point
```

## Ad blocking

Uses `@ghostery/adblocker-electron` with prebuilt filter lists (fetched on first
run, then cached). If the lists can't be fetched (offline), a small built-in
domain blocklist still catches the most common ad/tracker hosts.

## Notes / limits (v1)

- Single window. No profiles, sync, extensions, or downloads manager yet.
- The dashboard's MTG and Sports widgets are static seeds, clearly dated —
  update them in the widget files or wire a live source later.
- `window.milk.data` only works on local pages (`file://`, `localhost`);
  regular websites can't touch your JSON.
- Dev-only: `MILK_SHOT=1 npm start` captures the chrome and dashboard to
  `/tmp/milk-shot-*.png` (for headless UI checks), runs a data IPC
  round-trip self-test, then quits.
