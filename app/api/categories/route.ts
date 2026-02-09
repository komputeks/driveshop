// app/api/categories/route.ts
import { NextResponse } from "next/server";
import type { CategoryTreeResponse } from "@/lib/types";

const GAS_ENDPOINT = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function GET() {
  try {
    const url = `${GAS_ENDPOINT}?action=category-tree`;

    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "force-cache",
    });

    const json = (await res.json()) as CategoryTreeResponse;
    return NextResponse.json(json);
  } catch (err: any) {
    console.error("GET /api/categories", err);
    return NextResponse.json(
      { ok: false, error: err.message ?? "Internal error" },
      { status: 500 }
    );
  }
}