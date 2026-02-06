"use client";

import useSWR from "swr";
import type {
  UserProfileResponse,
  GetUserProfileRequest
} from "@/lib/publicProfileTypes";

async function fetcher(payload: GetUserProfileRequest) {
  const res = await fetch("/api/public-profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return res.json();
}

export function usePublicProfile(email: string) {
  return useSWR<UserProfileResponse>(
    email
      ? {
          action: "getUserProfile",
          email,
          limit: 20,
        }
      : null,
    fetcher
  );
}