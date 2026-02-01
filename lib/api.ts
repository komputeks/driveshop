import { NextResponse } from "next/server";

const GAS_URL = process.env.NEXTJS_PUBLIC_API_BASE_URL!;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    return NextResponse.json(data);

  } catch (err: any) {
    console.error("API ERROR:", err);

    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}