// app/api/category-tree/route.ts
import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/typedFetch";
import type { CategoryTreeResponse } from "@/lib/types";

const GAS_ENDPOINT = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function GET() {
  const action = "category-tree";

  try {
    const data = await apiFetch<CategoryTreeResponse>(
      `${GAS_ENDPOINT}?action=${action}`,
      { action }
    );

    return NextResponse.json(data);
  } catch (err: any) {
    // Still log on server console for debugging
    console.error(`GET /api/${action}`, err);

    return NextResponse.json(
      {
        ok: false,
        error: err.message ?? "Internal error",
        action: err.action,
        durationMs: err.durationMs,
      },
      { status: 500 }
    );
  }
}