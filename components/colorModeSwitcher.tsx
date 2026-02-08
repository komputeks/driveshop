"use client";

import { useColorMode } from "@/lib/useColorMode";

export function ColorModeSwitcher() {
  const { mode, setLight, setDark } = useColorMode();

  return (
    <div className="inline-flex gap-2">
      <button
        onClick={setLight}
        className={`btn-ghost ${mode === "light" ? "ring-2 ring-blue-500" : ""}`}
      >
        Light
      </button>

      <button
        onClick={setDark}
        className={`btn-ghost ${mode === "dark" ? "ring-2 ring-blue-500" : ""}`}
      >
        Dark
      </button>
    </div>
  );
}