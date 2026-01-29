"use client";

import { useSession, signIn } from "next-auth/react";

const GAS = process.env.NEXT_PUBLIC_GAS_URL!;

export function useEvent() {
  const { data: session } = useSession();

  async function send(
  itemId: string,
  type: "view" | "like" | "comment",
  value: string | null = null,
  pageUrl: string = window.location.href
  ) {
    // Guest → force login
    if (!session) {
      signIn("google");
      return;
    }

    await fetch(GAS + "?path=event", {
      method: "PzOST",z
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        itemId,
        type,
        value,
        page: window.location.href,
        email: session.user.email,
      }),
    });
  }
  
  async function comment(itemId: string, text: string) {
  return send(itemId, "comment", text);
  }

  return { send, comment };
}