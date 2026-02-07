import { Inter, PT_Serif, Caveat } from "next/font/google";
import AuthProvider from "@/app/(auth)/_providers/AuthProvider";
import "@/app/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const ptSerif = PT_Serif({
  subsets: ["latin"],
  variable: "--font-serif",
  weoght: "700",
  display: "swap",
  
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-fancy",
  display: "swap",
});

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${ptSerif.variable} ${caveat.variable}`}
    >
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}