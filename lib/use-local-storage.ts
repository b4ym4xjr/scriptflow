"use client";

import { useCallback, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

/**
 * Hydration-safe localStorage-backed string state.
 * Server render and first client render both use `fallback`.
 */
export function useLocalStorage<T extends string>(
  key: string,
  fallback: T,
): [T, (value: T) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => (localStorage.getItem(key) as T | null) ?? fallback,
    () => fallback,
  );

  const set = useCallback(
    (next: T) => {
      localStorage.setItem(key, next);
      listeners.forEach((l) => l());
    },
    [key],
  );

  return [value, set];
}

/**
 * `false` during SSR and the hydration render, `true` afterwards.
 * Gate anything that depends on "now" or the viewer's timezone behind this so the
 * server HTML (often UTC) can never disagree with the client.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/** A stable client-only value that falls back to `serverValue` during SSR/hydration. */
export function useClientValue<T>(compute: () => T, serverValue: T): T {
  return useSyncExternalStore(
    () => () => {},
    compute,
    () => serverValue,
  );
}
