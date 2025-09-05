// utils/useIsXs.ts
"use client";
import { useEffect, useState } from "react";

export function useIsXs(max = 425) {
  const [xs, setXs] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(`(max-width:${max}px)`);
    const handler = () => setXs(m.matches);
    handler();
    m.addEventListener?.("change", handler);
    return () => m.removeEventListener?.("change", handler);
  }, [max]);
  return xs;
}
