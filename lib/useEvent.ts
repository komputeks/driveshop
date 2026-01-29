"use client";

import { useSession, signIn } from "next-auth/react";
import { sendEvent } from "./api";

export function useEvent() {
  const { data: session } = useSession();

  async function send(
    itemId: string,
    type: "view" | "like" | "comment",
    value?: string
  ) {
    if (!session?.user?.email) {
      signIn("google");
      return;
    }

    await sendEvent({
      itemId,
      type,
      value: value || "",
      pageUrl: window.location.href,
      email: session.user.email,
    });
  }

  return { send };
}