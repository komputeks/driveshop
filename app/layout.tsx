import "./globals.css";
import AuthProvider from "@/components/SessionProvider";
import { ClientUserSyncWrapper } from "@/components/ClientUserSyncWrapper";

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
        <ClientUserSyncWrapper />
            {children}
        </AuthProvider>
      </body>
    </html>
  );
}