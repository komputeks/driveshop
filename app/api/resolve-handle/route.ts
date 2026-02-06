import { NextResponse } from "next/server";
import type {
  ResolveHandleRequest,
  ResolveHandleResponse
} from "@/lib/publicProfileTypes";

const GAS_ENDPOINT = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ResolveHandleRequest;

    if (!body.handle) {
      return NextResponse.json(
        { ok: false, error: "Missing handle" },
        { status: 400 }
      );
    }

    const res = await fetch(GAS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "resolveUserHandle",
        handle: body.handle,
      }),
      next: {
        revalidate: 60 * 10, // 10 min cache
        tags: [`handle:${body.handle}`],
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: "Upstream error" },
        { status: 502 }
      );
    }

    const data = (await res.json()) as ResolveHandleResponse;

    return NextResponse.json(data);
  } catch (e) {
    console.error("resolve-handle error", e);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}