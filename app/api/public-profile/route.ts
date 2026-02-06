import { NextResponse } from "next/server";
import type {
  GetUserProfileRequest,
  UserProfileResponse
} from "@/lib/publicProfileTypes";

const GAS_ENDPOINT = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GetUserProfileRequest;

    if (!body.email) {
      return NextResponse.json(
        { ok: false, error: "Missing email" },
        { status: 400 }
      );
    }

    const res = await fetch(GAS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: "Upstream error" },
        { status: 502 }
      );
    }

    const data = (await res.json()) as UserProfileResponse;

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("public-profile error", e);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}