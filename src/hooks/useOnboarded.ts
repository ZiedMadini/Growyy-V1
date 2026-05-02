// src/hooks/useOnboarded.ts
import { useCallback, useEffect, useState } from "react";

const KEY = "growy_onboarded";

export function useOnboarded(): [boolean, (v: boolean) => void] {
  // SSR-safe default: pretend onboarded during SSR to avoid a flash of /welcome
  const [onboarded, setOnboardedState] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setOnboardedState(window.localStorage.getItem(KEY) === "true");
  }, []);

  const setOnboarded = useCallback((v: boolean) => {
    if (typeof window === "undefined") return;
    if (v) window.localStorage.setItem(KEY, "true");
    else window.localStorage.removeItem(KEY);
    setOnboardedState(v);
  }, []);

  return [onboarded, setOnboarded];
}
