import { NextResponse } from "next/server";
import type {
  GetUserProfileResponse,
  UserActivityProfile,
} from "@/lib/types";

const GAS_ENDPOINT = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function POST(req: Request) {
  try {
    if (!GAS_ENDPOINT) {
      throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
    }

    const body = await req.json();

    if (!body?.email) {
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
        email: body.email,
      }),
      cache: "no-store",
    });

    const json = await res.json();

    /* ------------------------------
       GAS-level error passthrough
    ------------------------------ */
    if (!json || json.ok !== true) {
      return NextResponse.json(
        { ok: false, error: json?.error || "GAS error" },
        { status: 200 }
      );
    }

    /* ------------------------------
       Normalize → canonical API shape
       (defensive, future-safe)
    ------------------------------ */
    const data: UserActivityProfile =
      json.data ?? json;

    const normalized: GetUserProfileResponse = {
      ok: true,
      data,
    };

    return NextResponse.json(normalized, {
      headers: { "Cache-Control": "no-store" },
    });

  } catch (e: any) {
    console.error("user-activity error", e);

    return NextResponse.json(
      { ok: false, error: e.message || "Server error" },
      { status: 500 }
    );
  }
}