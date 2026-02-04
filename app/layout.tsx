import Providers from "./providers";
import UserSyncGate from "./UserSyncGate";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <UserSyncGate />
          {children}
        </Providers>
      </body>
    </html>
  );
}