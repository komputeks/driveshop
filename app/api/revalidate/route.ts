import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST(req: Request) {
  try {
    const { tags } = await req.json();

    if (!Array.isArray(tags)) {
      return NextResponse.json(
        { ok: false, error: "Invalid tags" },
        { status: 400 }
      );
    }

    tags.forEach(tag => revalidateTag(tag, {}));

    return NextResponse.json({ ok: true, tags });
  } catch (e) {
    console.error("Revalidate failed:", e);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}