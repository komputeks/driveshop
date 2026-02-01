import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { callGAS } from "@/lib/api";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  const res = await callGAS("user/get", { email });

  return NextResponse.json(res);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json();

  await callGAS("user/upsert", {
    email: session.user.email,
    name: body.name,
    phone: body.phone,
    photo: session.user.image || "",
  });

  return NextResponse.json({ ok: true });
}