import { NextResponse } from "next/server";
import type { CategoryTreeResponse } from "@/types";

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

    const categories: CategoryTreeResponse["data"]["categories"] = data.categories;

    return NextResponse.json({ ok: true, data: { categories } });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "Unknown error" }, { status: 500 });
  }
}