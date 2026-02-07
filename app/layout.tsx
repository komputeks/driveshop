import "./globals.css";
import { fontSans, fontSerif, fontFancy } from "./fonts";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`
          ${fontSans.variable}
          ${fontSerif.variable}
          ${fontFancy.variable}
        `}
      >
        {children}
      </body>
    </html>
  );
}