// app/api/items/[slug]/route.ts
import { NextResponse } from "next/server";
import type { ItemBySlugResponse } from "@/lib/types";

const GAS_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "item-by-slug",
        slug,
      }),
      cache: "no-store",
    });

    const data = (await res.json()) as ItemBySlugResponse;

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}