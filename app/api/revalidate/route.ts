import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { tags } = await req.json();

    // ✅ Fix: pass options explicitly
    tags.forEach((tag: string) => revalidateTag(tag, { revalidate: true }));

    return NextResponse.json({ ok: true, tags });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message });
  }
}