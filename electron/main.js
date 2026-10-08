/*
 * Milk Browser — main process
 *
 * Architecture:
 *   - One frameless BrowserWindow.
 *   - A fixed "chrome" WebContentsView at the top (tab bar, address bar, palette).
 *   - One WebContentsView per tab below the chrome. Only the active tab's view
 *     is attached; the rest are detached (their webContents stay alive).
 *   - The dashboard is just a tab pointing at our local dashboard.html.
 *   - All local data lives in ../data/*.json, read/written over IPC.
 */
'use strict';

const { app, BrowserWindow, WebContentsView, ipcMain, session } = require('electron');
const path = require('path');
const fs = require('fs');

const CHROME_HEIGHT = 104; // must match the chrome UI's rendered height
const DASHBOARD_TITLE = 'New Tab';
const isDev = process.env.MILK_DEV === '1';

const DATA_DIR = path.join(__dirname, '..', 'data');
const PRELOAD = path.join(__dirname, 'preload.js');
const CHROME_URL = isDev
  ? 'http://127.0.0.1:5173/chrome.html'
  : `file://${path.join(__dirname, '..', 'dist', 'chrome.html')}`;
const DASHBOARD_URL = isDev
  ? 'http://127.0.0.1:5173/dashboard.html'
  : `file://${path.join(__dirname, '..', 'dist', 'dashboard.html')}`;

let win = null;
let chromeView = null;
const tabs = new Map(); // id -> { id, view, url, title }
let tabSeq = 0;
let activeTabId = null;

/* ------------------------------- data layer ------------------------------ */

function dataFile(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

ipcMain.handle('data:get', (_evt, name) => {
  if (!/^[a-z0-9-]+$/i.test(name)) return null;
  try {
    return JSON.parse(fs.readFileSync(dataFile(name), 'utf8'));
  } catch {
    return null;
  }
});

ipcMain.handle('data:set', (_evt, name, obj) => {
  if (!/^[a-z0-9-]+$/i.test(name)) return false;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(dataFile(name), JSON.stringify(obj, null, 2) + '\n');
    return true;
  } catch (err) {
    console.error('[data] write failed:', err.message);
    return false;
  }
});

/* --------------------------------- tabs ---------------------------------- */

function tabSnapshot() {
  return [...tabs.values()].map((t) => {
    const nav = t.view.webContents.navigationHistory;
    return {
      id: t.id,
      title: t.title,
      url: t.url,
      active: t.id === activeTabId,
      canGoBack: nav.canGoBack(),
      canGoForward: nav.canGoForward(),
    };
  });
}

function emitTabs() {
  if (chromeView && !chromeView.webContents.isDestroyed()) {
    chromeView.webContents.send('tabs:updated', tabSnapshot());
  }
}

function layoutViews() {
  if (!win || win.isDestroyed()) return;
  const [w, h] = win.getContentSize();
  chromeView.setBounds({ x: 0, y: 0, width: w, height: CHROME_HEIGHT });
  for (const t of tabs.values()) {
    if (t.id === activeTabId) {
      t.view.setBounds({ x: 0, y: CHROME_HEIGHT, width: w, height: Math.max(0, h - CHROME_HEIGHT) });
    }
  }
}

function attachActive() {
  for (const t of tabs.values()) {
    const attached = win.contentView.children.includes(t.view);
    if (t.id === activeTabId && !attached) win.contentView.addChildView(t.view);
    if (t.id !== activeTabId && attached) win.contentView.removeChildView(t.view);
  }
  layoutViews();
}

function resolveInput(input) {
  const raw = String(input || '').trim();
  if (!raw) return null;
  if (raw === 'milk://newtab') return DASHBOARD_URL;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(raw)) return raw; // has a scheme
  // bare domain like example.com or localhost:3000/path — no spaces
  if (/^[\w-]+(\.[\w-]+)+(:\d+)?(\/\S*)?$/.test(raw) && !/\s/.test(raw)) {
    return 'https://' + raw;
  }
  if (/^localhost(:\d+)?(\/\S*)?$/.test(raw)) return 'http://' + raw;
  return 'https://duckduckgo.com/?q=' + encodeURIComponent(raw);
}

function wireTabEvents(id, view) {
  const wc = view.webContents;
  wc.on('page-title-updated', (_e, title) => {
    const t = tabs.get(id);
    if (t) {
      t.title = title || 'New Tab';
      emitTabs();
    }
  });
  const urlChanged = () => {
    const t = tabs.get(id);
    if (t) {
      t.url = wc.getURL();
      if (!t.title || t.title === DASHBOARD_TITLE) {
        t.title = t.url.startsWith('file:') || t.url.includes('dashboard.html') ? DASHBOARD_TITLE : t.url;
      }
      emitTabs();
    }
  };
  wc.on('did-navigate', urlChanged);
  wc.on('did-navigate-in-page', urlChanged);

  // Browser keyboard shortcuts, intercepted before the page sees them.
  // Shared by tab content views and the chrome view itself.
  const onBeforeInput = (event, input) => {
    if (input.type !== 'keyDown' || !input.control || input.alt || input.meta || input.shift) return;
    const k = String(input.key || '').toLowerCase();
    if (k === 't') {
      event.preventDefault();
      createTab(DASHBOARD_URL);
    } else if (k === 'w') {
      event.preventDefault();
      closeTab(activeTabId);
    } else if (k === 'k') {
      event.preventDefault();
      if (chromeView && !chromeView.webContents.isDestroyed()) {
        chromeView.webContents.send('open-palette');
      }
    } else if (k === 'l') {
      event.preventDefault();
      if (chromeView && !chromeView.webContents.isDestroyed()) {
        chromeView.webContents.send('focus-address');
      }
    } else if (k === 'r') {
      event.preventDefault();
      const t = tabs.get(activeTabId);
      if (t) t.view.webContents.reload();
    }
  };
  wc.on('before-input-event', onBeforeInput);
}

function wireChromeShortcuts() {
  // Same shortcuts when focus is in the address bar / tab strip.
  chromeView.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown' || !input.control || input.alt || input.meta || input.shift) return;
    const k = String(input.key || '').toLowerCase();
    if (k === 't') {
      event.preventDefault();
      createTab(DASHBOARD_URL);
    } else if (k === 'w') {
      event.preventDefault();
      closeTab(activeTabId);
    } else if (k === 'k') {
      event.preventDefault();
      chromeView.webContents.send('open-palette');
    } else if (k === 'l') {
      event.preventDefault();
      chromeView.webContents.send('focus-address');
    }
  });
}

function createTab(url) {
  const id = ++tabSeq;
  const view = new WebContentsView({
    webPreferences: {
      preload: PRELOAD,
      contextIsolation: true,
      sandbox: true,
    },
  });
  tabs.set(id, { id, view, url: url || DASHBOARD_URL, title: DASHBOARD_TITLE });
  wireTabEvents(id, view);
  activeTabId = id;
  attachActive();
  view.webContents.loadURL(url || DASHBOARD_URL);
  emitTabs();
  return id;
}

function closeTab(id) {
  const t = tabs.get(id);
  if (!t) return;
  if (win && !win.isDestroyed() && win.contentView.children.includes(t.view)) {
    win.contentView.removeChildView(t.view);
  }
  if (!t.view.webContents.isDestroyed()) t.view.webContents.close();
  tabs.delete(id);
  if (activeTabId === id) {
    const remaining = [...tabs.keys()];
    activeTabId = remaining.length ? remaining[remaining.length - 1] : null;
  }
  if (!activeTabId) {
    createTab(DASHBOARD_URL); // never leave the user with zero tabs
  } else {
    attachActive();
    emitTabs();
  }
}

function activateTab(id) {
  if (!tabs.has(id)) return;
  activeTabId = id;
  attachActive();
  emitTabs();
}

/* ------------------------------- IPC: tabs ------------------------------- */

ipcMain.handle('tabs:list', () => tabSnapshot());
ipcMain.handle('tabs:create', (_e, url) => createTab(url ? resolveInput(url) || DASHBOARD_URL : DASHBOARD_URL));
ipcMain.handle('tabs:close', (_e, id) => closeTab(id));
ipcMain.handle('tabs:activate', (_e, id) => activateTab(id));
ipcMain.handle('tabs:navigate', (_e, id, input) => {
  const t = tabs.get(id);
  const url = resolveInput(input);
  if (t && url) {
    t.url = url;
    t.title = DASHBOARD_TITLE;
    t.view.webContents.loadURL(url);
    emitTabs();
  }
});
ipcMain.handle('tabs:back', (_e, id) => {
  const t = tabs.get(id);
  if (t && t.view.webContents.navigationHistory.canGoBack()) t.view.webContents.goBack();
});
ipcMain.handle('tabs:forward', (_e, id) => {
  const t = tabs.get(id);
  if (t && t.view.webContents.navigationHistory.canGoForward()) t.view.webContents.goForward();
});
ipcMain.handle('tabs:reload', (_e, id) => {
  const t = tabs.get(id);
  if (t) t.view.webContents.reload();
});

/* ------------------------------- IPC: window ------------------------------ */

ipcMain.handle('win:minimize', () => win && win.minimize());
ipcMain.handle('win:togglemax', () => {
  if (!win) return;
  if (win.isMaximized()) win.unmaximize();
  else win.maximize();
});
ipcMain.handle('win:close', () => win && win.close());
ipcMain.handle('win:ismax', () => (win ? win.isMaximized() : false));

/* --------------------------------- window --------------------------------- */

function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    frame: false, // we draw our own chrome
    titleBarStyle: 'hidden',
    backgroundColor: '#09090b',
    show: false,
    webPreferences: {
      preload: PRELOAD,
      contextIsolation: true,
      sandbox: true,
    },
  });

  chromeView = new WebContentsView({
    webPreferences: {
      preload: PRELOAD,
      contextIsolation: true,
      sandbox: true,
    },
  });
  win.contentView.addChildView(chromeView);
  chromeView.webContents.loadURL(CHROME_URL);
  wireChromeShortcuts();

  win.on('resize', layoutViews);
  win.on('maximize', () => chromeView.webContents.send('window:max-changed'));
  win.on('unmaximize', () => chromeView.webContents.send('window:max-changed'));

  // Open external app links (e.g. mailto:) outside the browser.
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  chromeView.webContents.once('did-finish-load', () => {
    layoutViews();
    createTab(DASHBOARD_URL); // first tab: the dashboard
    win.show();
    console.log('[milk] ready');

    // Dev-only visual verification: MILK_SHOT=1 captures the chrome and
    // the active tab to /tmp, then quits. Used for headless UI checks.
    if (process.env.MILK_SHOT === '1') {
      setTimeout(async () => {
        try {
          const saved = [];
          if (chromeView && !chromeView.webContents.isDestroyed()) {
            const img = await chromeView.webContents.capturePage();
            fs.writeFileSync('/tmp/milk-shot-chrome.png', img.toPNG());
            saved.push('chrome');
          }
          const t = tabs.get(activeTabId);
          if (t && !t.view.webContents.isDestroyed()) {
            win.setSize(1440, 2400); // tall window so the full dashboard is visible
            layoutViews();
            await new Promise((r) => setTimeout(r, 1200));
            const img2 = await t.view.webContents.capturePage();
            fs.writeFileSync('/tmp/milk-shot-dashboard.png', img2.toPNG());
            saved.push('dashboard-full');

            // End-to-end IPC check: read routines through the renderer's
            // own bridge, then write the unchanged object back.
            try {
              const rt = await t.view.webContents.executeJavaScript(`(async () => {
                const d = await window.milk.data.get('routines');
                if (!d || !d.routines) return 'GET_FAIL';
                const ok = await window.milk.data.set('routines', d);
                return ok ? 'ROUNDTRIP_OK n=' + d.routines.length : 'SET_FAIL';
              })()`);
              console.log('[milk-shot] data roundtrip:', rt);
            } catch (e) {
              console.error('[milk-shot] data roundtrip failed:', e.message);
            }
          }
          console.log('[milk-shot] saved:', saved.join(', '));
        } catch (e) {
          console.error('[milk-shot] failed:', e.message);
        }
        setTimeout(() => app.quit(), 800);
      }, 5000);
    }
  });
}

app.whenReady().then(async () => {
  if (!app.requestSingleInstanceLock()) {
    app.quit();
    return;
  }
  try {
    const { setupAdblock } = require('./adblock');
    await setupAdblock(session.defaultSession);
  } catch (err) {
    console.warn('[adblock] setup failed:', err.message);
  }
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

process.on('uncaughtException', (err) => {
  console.error('[milk] uncaught:', err);
});
