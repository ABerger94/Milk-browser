/*
 * useMilkData — React hook for the local JSON store.
 *
 * Reads through window.milk.data (the Electron preload bridge) when we're
 * inside Milk Browser, and falls back to localStorage when the dashboard is
 * opened in a regular browser (handy for UI development).
 *
 * Pass subscribeKey (e.g. 'routines') to re-read whenever another widget
 * writes: bus.emit('routines') after saving notifies every subscriber.
 */
import { useCallback, useEffect, useState } from 'react';
import { bus } from './utils';

const hasMilk = () => typeof window !== 'undefined' && !!window.milk?.data;

async function readStore(name, fallback) {
  if (hasMilk()) {
    try {
      const d = await window.milk.data.get(name);
      if (d) return d;
    } catch { /* fall through to fallback */ }
  }
  try {
    const raw = localStorage.getItem('milk-fallback-' + name);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return fallback;
}

async function writeStore(name, obj) {
  if (hasMilk()) {
    try {
      await window.milk.data.set(name, obj);
      return;
    } catch { /* fall through */ }
  }
  try {
    localStorage.setItem('milk-fallback-' + name, JSON.stringify(obj));
  } catch { /* ignore */ }
}

export function useMilkData(name, fallback, subscribeKey) {
  const [data, setData] = useState(fallback);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let live = true;
    readStore(name, fallback).then((d) => {
      if (live) {
        setData(d);
        setLoaded(true);
      }
    });
    let off;
    if (subscribeKey) {
      off = bus.on(subscribeKey, async () => {
        const d = await readStore(name, fallback);
        if (live) setData(d);
      });
    }
    return () => {
      live = false;
      if (off) off();
    };
  }, [name]);

  const save = useCallback(
    (next) => {
      setData(next);
      writeStore(name, next).then(() => {
        if (subscribeKey) bus.emit(subscribeKey);
      });
    },
    [name, subscribeKey]
  );

  return [data, save, loaded];
}

/* Mark a routine done for today. Shared by widgets + command palette. */
export async function markRoutineDone(routineId) {
  const data = await readStore('routines', { routines: [] });
  const today = new Date();
  const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;
  const routines = (data.routines || []).map((r) => {
    if (r.id !== routineId) return r;
    const completions = r.completions || [];
    if (!completions.includes(key)) completions.push(key);
    return { ...r, completions };
  });
  await writeStore('routines', { ...data, routines });
  bus.emit('routines');
}
