import { useSyncExternalStore } from "react";

// Watchlist lives on the device (localStorage). No account needed.
const KEY = "mc.watchlist.v1";
const listeners = new Set<() => void>();

function read(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

let current = read();

function write(next: string[]) {
  current = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode: keep in memory */
  }
  listeners.forEach((l) => l());
}

export const watchlist = {
  get: () => current,
  has: (s: string) => current.includes(s),
  add: (s: string) => !current.includes(s) && write([...current, s]),
  remove: (s: string) => write(current.filter((x) => x !== s)),
  toggle: (s: string) => (current.includes(s) ? watchlist.remove(s) : watchlist.add(s)),
};

export function useWatchlist() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
  );
}
