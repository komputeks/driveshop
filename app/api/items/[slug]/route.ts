// app/api/items/[slug]/route.ts
import { NextResponse } from "next/server";
import type { ItemBySlugResponse } from "@/lib/types";

const GAS_ENDPOINT = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;

    if (!slug) {
      return NextResponse.json(
        { ok: false, error: "Missing slug" },
        { status: 400 }
      );
    }

    const url =
      `${GAS_ENDPOINT}?action=item-by-slug&slug=` +
      encodeURIComponent(slug);

    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    const json = (await res.json()) as ItemBySlugResponse;
    return NextResponse.json(json);
  } catch (err: any) {
    console.error("GET /api/items/[slug]", err);
    return NextResponse.json(
      { ok: false, error: err.message ?? "Internal error" },
      { status: 500 }
    );
  }
}