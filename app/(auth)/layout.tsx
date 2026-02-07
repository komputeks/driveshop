import AuthProvider from "@/app/(auth)/_providers/AuthProvider";
import { Inter, PT_Serif, Caveat } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const ptSerif = PT_Serif({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-heading",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-accent",
  display: "swap",
});

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${ptSerif.variable} ${caveat.variable}`}
    >
      <body><AuthProvider>{children}<AuthProvider/></body>
    </html>
  );
}