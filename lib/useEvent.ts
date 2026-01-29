"use client";

import { useSession, signIn } from "next-auth/react";

const GAS = process.env.NEXT_PUBLIC_GAS_URL!;

export function useEvent() {
  const { data: session } = useSession();

  async function send(
    itemId: string,
    type: "view" | "like" | "comment",
    value?: string
  ) {
    // Guest → force login
    if (!session) {
      signIn("google");
      return;
    }

    await fetch(GAS + "?path=event", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        itemId,
        type,
        value,
        email: session.user.email,
      }),
    });
  }

  return { send };
}