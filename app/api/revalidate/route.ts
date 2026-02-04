import { NextResponse } from "next/server";
import crypto from "crypto";
import { revalidateTag } from "next/cache";

const ALLOWED_ACTIONS = new Set(["revalidate"]);
const MAX_SKEW = 60; // seconds

export async function POST(req: Request) {
  try {
    const action = req.headers.get("x-action") || "";
    const timestamp = req.headers.get("x-timestamp") || "";
    const signature = req.headers.get("x-signature") || "";

    if (!ALLOWED_ACTIONS.has(action)) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }

    const now = Math.floor(Date.now() / 1000);
    const tsNum = Number(timestamp);
    if (isNaN(tsNum) || Math.abs(now - tsNum) > MAX_SKEW) {
      return NextResponse.json({ ok: false, error: "Expired" }, { status: 401 });
    }

    const body = await req.text();
    const base = `${action}.${timestamp}.${body}`;

    const expected = crypto
      .createHmac("sha256", process.env.NEXTJS_HMAC_SECRET!)
      .update(base)
      .digest("hex");

    if (!crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    )) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const { tags } = JSON.parse(body);

    if (!Array.isArray(tags) || !tags.every(t => typeof t === "string")) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // ✅ Revalidate all tags
    tags.forEach(tag => revalidateTag(tag, {}));

    return NextResponse.json({ ok: true, tags });

  } catch (e) {
    console.error("Revalidate POST failed:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}