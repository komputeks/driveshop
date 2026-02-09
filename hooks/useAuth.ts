// hooks/useAuth.ts
import { useSession } from "next-auth/react";

export function useAuth() {
  const { data, status } = useSession();
  return {
    user: data?.user ?? null,
    status,
    isAuthenticated: !!data?.user,
  };
}