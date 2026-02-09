import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}?action=category-tree`
    );

    const data = await res.json();

    if (!data.ok || !data.categories) {
      return NextResponse.json(
        { ok: false, error: "Failed to fetch categories" },
        { status: 500 }
      );
    }

    // Correctly map GAS response
    const categories = data.categories.map((cat: any) => ({
      name: cat.name,
      slug: cat.slug,
      children: cat.children || [],
    }));

    return NextResponse.json({ ok: true, categories });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}