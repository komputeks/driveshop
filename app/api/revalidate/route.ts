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
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const now = Math.floor(Date.now() / 1000);
    const tsNum = Number(timestamp);

    if (!tsNum || Math.abs(now - tsNum) > MAX_SKEW) {
      return NextResponse.json(
        { ok: false, error: "Expired request" },
        { status: 401 }
      );
    }

    const body = await req.text();
    const base = `${action}.${timestamp}.${body}`;

    const expected = crypto
      .createHmac("sha256", process.env.GAS_API_SIGNING_SECRET!)
      .update(base)
      .digest("hex");

    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expected, "hex");

    if (
      sigBuf.length !== expBuf.length ||
      !crypto.timingSafeEqual(sigBuf, expBuf)
    ) {
      return NextResponse.json(
        { ok: false, error: "Invalid signature" },
        { status: 401 }
      );
    }

    const { tags } = JSON.parse(body);

    if (!Array.isArray(tags) || !tags.every(t => typeof t === "string")) {
      return NextResponse.json(
        { ok: false, error: "Invalid tags" },
        { status: 400 }
      );
    }

    // 🔁 Revalidate semantic cache tags (Next.js 14+)
    tags.forEach(tag => {
      revalidateTag(tag, "page");
    });

    return NextResponse.json({ ok: true, tags });

  } catch (e) {
    console.error("Revalidate POST failed:", e);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 }
    );
  }
}