// app/_app.tsx
"use client";

import { ThemeProvider } from "next-themes";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import "@/app/globals.css";
import { ToastProvider } from "@/components/ToastProvider"; // optional toast stack

export default function App({ Component, pageProps }: AppProps) {
  // Optional: fix Tailwind dark mode flicker
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove("light", "dark");
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      value={{
        light: "light",
        dark: "dark",
        // optional extra theme presets
        blue: "theme-blue",
        green: "theme-green",
      }}
    >
      <ToastProvider>
        <Component {...pageProps} />
      </ToastProvider>
    </ThemeProvider>
  );
}