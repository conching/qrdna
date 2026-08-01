"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Read a localStorage value without copying it into React state.
 *
 * The obvious version — `useState(default)` plus an effect that reads storage
 * and calls `setState` — triggers a second render pass on every mount and is
 * what the `react-hooks/set-state-in-effect` rule is warning about. A lazy
 * `useState` initializer is no better here: it runs during server rendering
 * too, where `localStorage` does not exist, so the value has to be guarded and
 * the guard reintroduces a hydration mismatch.
 *
 * `useSyncExternalStore` is built for exactly this. `getServerSnapshot` returns
 * the fallback so the server and the first client render agree, and React
 * transitions to the stored value without a mismatch warning.
 */
export function useLocalStorage(
  key: string,
  fallback: string,
  isValid?: (value: string) => boolean,
): [string, (next: string) => void] {
  const subscribe = useCallback(
    (onChange: () => void) => {
      // `storage` fires for other tabs; the custom event covers this one.
      const local = () => onChange();
      window.addEventListener("storage", local);
      window.addEventListener(STORAGE_EVENT, local);
      return () => {
        window.removeEventListener("storage", local);
        window.removeEventListener(STORAGE_EVENT, local);
      };
    },
    [],
  );

  const getSnapshot = useCallback(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return fallback;
      if (isValid && !isValid(raw)) return fallback;
      return raw;
    } catch {
      // Private browsing and blocked storage both throw rather than return null.
      return fallback;
    }
  }, [key, fallback, isValid]);

  const value = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => fallback,
  );

  const setValue = useCallback(
    (next: string) => {
      try {
        window.localStorage.setItem(key, next);
      } catch {
        // Nothing to do — the preference simply will not persist.
      }
      window.dispatchEvent(new Event(STORAGE_EVENT));
    },
    [key],
  );

  return [value, setValue];
}

const STORAGE_EVENT = "qrdna:local-storage";
