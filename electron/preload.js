/*
 * Milk Browser — preload script.
 *
 * Exposes a small, deliberate API (`window.milk`) to the chrome UI and the
 * dashboard. Web pages loaded in tabs get the same preload, but the data APIs
 * refuse to run anywhere except our own local pages (file:// or localhost),
 * so random websites can't touch the local JSON store.
 */
'use strict';

const { contextBridge, ipcRenderer } = require('electron');

function isLocalPage() {
  try {
    const u = new URL(window.location.href);
    return u.protocol === 'file:' || (u.protocol === 'http:' && u.hostname === 'localhost');
  } catch {
    return false;
  }
}

contextBridge.exposeInMainWorld('milk', {
  tabs: {
    list: () => ipcRenderer.invoke('tabs:list'),
    create: (url) => ipcRenderer.invoke('tabs:create', url),
    close: (id) => ipcRenderer.invoke('tabs:close', id),
    activate: (id) => ipcRenderer.invoke('tabs:activate', id),
    navigate: (id, input) => ipcRenderer.invoke('tabs:navigate', id, input),
    back: (id) => ipcRenderer.invoke('tabs:back', id),
    forward: (id) => ipcRenderer.invoke('tabs:forward', id),
    reload: (id) => ipcRenderer.invoke('tabs:reload', id),
  },
  data: {
    // Local pages only. Returns null/false anywhere else.
    get: (name) => (isLocalPage() ? ipcRenderer.invoke('data:get', name) : Promise.resolve(null)),
    set: (name, obj) => (isLocalPage() ? ipcRenderer.invoke('data:set', name, obj) : Promise.resolve(false)),
  },
  win: {
    minimize: () => ipcRenderer.invoke('win:minimize'),
    toggleMax: () => ipcRenderer.invoke('win:togglemax'),
    close: () => ipcRenderer.invoke('win:close'),
    isMaximized: () => ipcRenderer.invoke('win:ismax'),
  },
  onTabs: (cb) => ipcRenderer.on('tabs:updated', (_e, tabs) => cb(tabs)),
  onOpenPalette: (cb) => ipcRenderer.on('open-palette', () => cb()),
  onFocusAddress: (cb) => ipcRenderer.on('focus-address', () => cb()),
  onMaxChanged: (cb) => ipcRenderer.on('window:max-changed', () => cb()),
});
