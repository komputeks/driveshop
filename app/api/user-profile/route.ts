import { NextResponse } from "next/server";

const GAS = process.env.NEXTJS_PUBLIC_API_BASE_URL!;

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    const [userRes, actRes] = await Promise.all([
      fetch(`${GAS}?path=user&email=${email}`),
      fetch(`${GAS}?path=user/activity&email=${email}`),
    ]);

    const user = await userRes.json();
    const activity = await actRes.json();

    return NextResponse.json({
      ok: true,
      user,
      activity,
    });

  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message },
      { status: 500 }
    );
  }
}