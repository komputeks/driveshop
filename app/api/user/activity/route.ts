import { NextResponse } from "next/server";
import type { UserProfileActivity } from "@/lib/userActivityTypes";

const GAS_ENDPOINT = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Missing email" },
        { status: 400 }
      );
    }

    const res = await fetch(GAS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "getUserProfile",
        email,
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: "Upstream error" },
        { status: 502 }
      );
    }

    const data = await res.json();

    return NextResponse.json(data as UserProfileActivity, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("user activity error", err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}