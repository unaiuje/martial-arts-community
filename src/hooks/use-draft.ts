import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

const PREFIX = "strive-draft:";

/**
 * useState that survives navigating away and back (and language switches).
 * Stored in sessionStorage; call clearDraft(key) after a successful submit.
 */
export function useDraft<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PREFIX + key);
      if (raw != null) setValue(JSON.parse(raw) as T);
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, [key]);
  useEffect(() => {
    if (!loaded) return;
    try {
      sessionStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [key, value, loaded]);
  return [value, setValue];
}

export function clearDraft(...keys: string[]) {
  try {
    for (const k of keys) sessionStorage.removeItem(PREFIX + k);
  } catch {
    /* ignore */
  }
}
