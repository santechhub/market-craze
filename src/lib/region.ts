import { useSyncExternalStore } from "react";
import type { Region } from "./types";

// Selected market (US or India), remembered on the device.
const KEY = "mc.region.v1";
const listeners = new Set<() => void>();

let current: Region = (() => {
  try {
    return localStorage.getItem(KEY) === "in" ? "in" : "us";
  } catch {
    return "us";
  }
})();

export function getRegion() {
  return current;
}

export function setRegion(r: Region) {
  current = r;
  try {
    localStorage.setItem(KEY, r);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function useRegion() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
  );
}
