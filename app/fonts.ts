import { Inter, PT_Serif, Caveat } from "next/font/google";

export const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const fontSerif = PT_Serif({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-serif",
  display: "swap",
});

export const fontFancy = Caveat({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-fancy",
  display: "swap",
});