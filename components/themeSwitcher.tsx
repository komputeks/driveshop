"use client";

import { useEffect, useState } from "react";

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = saved ?? (prefersDark ? "dark" : "light");

    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  return (
    <button
      onClick={toggle}
      aria-pressed={theme === "dark"}
      title="Toggle theme"
      className="
        btn
        px-3 py-2
        border border-[rgb(var(--border))]
        text-[rgb(var(--muted))]
        hover:border-[rgb(var(--primary))]
        hover:text-[rgb(var(--primary))]
        focus:ring-[rgb(var(--primary))]/40
      "
    >
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}