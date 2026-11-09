import { useSyncExternalStore } from "react";
import { getRegion, useRegion } from "./region";
import type { Region } from "./types";

// One watchlist per market, stored on the device (localStorage). No account needed.
const keyFor = (r: Region) => (r === "in" ? "mc.watchlist.in.v1" : "mc.watchlist.v1");
const listeners = new Set<() => void>();

function read(r: Region): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(keyFor(r)) ?? "[]");
    return Array.isArray(v) ? v.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

const lists: Record<Region, string[]> = { us: read("us"), in: read("in") };

function write(next: string[]) {
  const r = getRegion();
  lists[r] = next;
  try {
    localStorage.setItem(keyFor(r), JSON.stringify(next));
  } catch {
    /* private mode: keep in memory */
  }
  listeners.forEach((l) => l());
}

const cur = () => lists[getRegion()];

export const watchlist = {
  get: cur,
  has: (s: string) => cur().includes(s),
  add: (s: string) => !cur().includes(s) && write([...cur(), s]),
  remove: (s: string) => write(cur().filter((x) => x !== s)),
  toggle: (s: string) => (cur().includes(s) ? watchlist.remove(s) : watchlist.add(s)),
};

export function useWatchlist() {
  const region = useRegion();
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => lists[region],
  );
}
