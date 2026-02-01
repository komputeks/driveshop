import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const GAS_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

    const res = await fetch(`${GAS_URL}?path=user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.text();

    return NextResponse.json({
      ok: true,
      gas: data,
    });

  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message },
      { status: 500 }
    );
  }
}