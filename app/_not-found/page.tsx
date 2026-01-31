// _not-found/page.tsx
import { ClientUserSyncWrapper } from "@/components/ClientUserSyncWrapper";

export default function NotFoundPage() {
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>404 - Page Not Found</h1>
      <p>The page you’re looking for does not exist.</p>

      {/* Run useUserSync safely */}
      <ClientUserSyncWrapper />
    </div>
  );
}