import "./globals.css";
import AuthProvider from "@/components/SessionProvider";
import { useUserSync } from "@/lib/useUserSync";

function SyncWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  useUserSync();
  return <>{children}</>;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <SyncWrapper>
            {children}
          </SyncWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}