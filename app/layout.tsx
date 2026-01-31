// app/layout.tsx
import "./globals.css";
import AuthProvider from "@/components/SessionProvider";
import SyncWrapper from "@/components/SyncWrapper";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <SyncWrapper>{children}</SyncWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}