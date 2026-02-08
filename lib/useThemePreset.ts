"use client";

import { useEffect, useState } from "react";

const PRESETS = [
  "theme-default",
  "theme-ocean",
  "theme-sunset",
  "theme-forest",
  "theme-slate",
] as const;

type Preset = typeof PRESETS[number];

export function useThemePreset() {
  const [preset, setPreset] = useState<Preset>("theme-default");

  useEffect(() => {
    const saved = localStorage.getItem("theme-preset") as Preset | null;
    if (saved) setPreset(saved);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    PRESETS.forEach(p => root.classList.remove(p));
    root.classList.add(preset);
    localStorage.setItem("theme-preset", preset);
  }, [preset]);

  return { preset, setPreset, presets: PRESETS };
}