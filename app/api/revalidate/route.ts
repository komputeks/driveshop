// app/api/revalidate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache"; // Ensure this is imported correctly

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tags } = body;

    if (!tags || !Array.isArray(tags)) {
      return NextResponse.json({ ok: false, error: "Missing tags array" });
    }

    // TS-safe: pass empty options object if revalidateTag requires 2 args
    tags.forEach((tag: string) => revalidateTag(tag, {}));

    return NextResponse.json({ ok: true, tags });
  } catch (e: any) {
    console.error("Revalidate error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Unknown error" });
  }
}