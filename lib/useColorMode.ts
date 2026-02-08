"use client";

import { useEffect, useState } from "react";

type Mode = "light" | "dark";

export function useColorMode() {
  const [mode, setMode] = useState<Mode>("light");

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("color-mode") as Mode | null;
    if (saved) setMode(saved);
  }, []);

  // Apply to <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", mode === "dark");
    localStorage.setItem("color-mode", mode);
  }, [mode]);

  return {
    mode,
    setLight: () => setMode("light"),
    setDark: () => setMode("dark"),
    toggle: () => setMode(m => (m === "dark" ? "light" : "dark")),
  };
}