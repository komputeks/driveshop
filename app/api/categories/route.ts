// app/api/categories/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}?action=getCategoryTree`
    );

    const data = await res.json();

    if (!data.ok || !data.categories) {
      return NextResponse.json(
        { ok: false, error: "Failed to fetch categories" },
        { status: 500 }
      );
    }

    // Transform into your CategoryTreeNode format
    const categories = data.categories.map((name: string) => ({
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      children: [],
    }));

    return NextResponse.json({ ok: true, categories });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}