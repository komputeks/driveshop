// app/api/revalidate/route.ts

import { NextResponse } from "next/server";
import crypto from "crypto";
import { revalidateTag } from "next/cache";

const ALLOWED_ACTION = "revalidate";
const MAX_SKEW_SECONDS = 60;

export async function POST(req: Request) {
  try {
    const action = req.headers.get("x-action");
    const tsHeader = req.headers.get("x-ts");
    const signature = req.headers.get("x-signature");

    if (!action || !tsHeader || !signature) {
      return NextResponse.json(
        { ok: false, error: "Missing headers" },
        { status: 400 }
      );
    }

    if (action !== ALLOWED_ACTION) {
      return NextResponse.json(
        { ok: false, error: "Action not allowed" },
        { status: 403 }
      );
    }

    const ts = Number(tsHeader);
    const now = Math.floor(Date.now() / 1000);

    if (!ts || Math.abs(now - ts) > MAX_SKEW_SECONDS) {
      return NextResponse.json(
        { ok: false, error: "Expired request" },
        { status: 401 }
      );
    }

    const bodyText = await req.text();

    const base = `${action}.${tsHeader}.${bodyText}`;

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

    let parsed: unknown;
    try {
      parsed = JSON.parse(bodyText);
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { tags } = parsed as { tags?: unknown };

    if (!Array.isArray(tags) || !tags.every(t => typeof t === "string")) {
      return NextResponse.json(
        { ok: false, error: "Invalid tags payload" },
        { status: 400 }
      );
    }

    // 🔁 Revalidate semantic tags
    tags.forEach(tag => revalidateTag(tag));

    return NextResponse.json({ ok: true, tags });

  } catch (err) {
    console.error("Revalidate POST failed:", err);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 }
    );
  }
}