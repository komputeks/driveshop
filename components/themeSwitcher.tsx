"use client";
import { useThemePreset } from "@/lib/useThemePreset";

export function ThemePresetSwitcher() {
  const { preset, setPreset, presets } = useThemePreset();

  return (
    <div className="flex gap-2">
      {presets.map(p => (
        <button
          key={p}
          onClick={() => setPreset(p)}
          className={`btn-ghost ${
            preset === p ? "ring-2 ring-primary" : ""
          }`}
        >
          {p.replace("theme-", "")}
        </button>
      ))}
    </div>
  );
}