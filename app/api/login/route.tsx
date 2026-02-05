// app/api/login/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, photo } = body;

    if (!email || !name) {
      return NextResponse.json({ ok: false, error: "Missing email or name" }, { status: 400 });
    }

    // call GAS login
    const res = await fetch(process.env.NEXT_PUBLIC_API_BASE_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", email, name, photo }),
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      return NextResponse.json({ ok: false, error: data.error || "GAS login failed" }, { status: 500 });
    }

    // store session in cookie/localStorage or return session info
    return NextResponse.json({ ok: true, user: data.user });
  } catch (err) {
    console.error("POST /api/login failed:", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}

