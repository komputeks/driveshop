// app/api/items/route.ts
import { NextResponse } from "next/server";
import type { ItemsListResponse } from "@/lib/types";

const GAS_ENDPOINT = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const qs = new URLSearchParams();
    qs.set("action", "items.list");

    // Forward optional filters
    ["page", "limit", "cat1", "cat2", "search"].forEach(key => {
      const v = searchParams.get(key);
      if (v) qs.set(key, v);
    });

    const url = `${GAS_ENDPOINT}?${qs.toString()}`;

    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    const json = (await res.json()) as ItemsListResponse;
    return NextResponse.json(json);
  } catch (err: any) {
    console.error("GET /api/items", err);
    return NextResponse.json(
      { ok: false, error: err.message ?? "Internal error" },
      { status: 500 }
    );
  }
}