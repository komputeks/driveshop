import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return Response.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json();

  const payload = {
    action: "login",
    email: session.user.email,
    name: body.name || session.user.name || "",
    photo: body.photo || session.user.image || "",
    ts: Date.now(),
  };

  const raw = JSON.stringify(payload);

  const signature = crypto
    .createHmac("sha256", process.env.API_SIGNING_SECRET!)
    .update(raw)
    .digest("hex");

  const res = await fetch(process.env.NEXT_PUBLIC_API_BASE_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Signature": signature,
    },
    body: raw,
  });

  const data = await res.json();

  if (!res.ok || !data?.ok) {
    return Response.json(
      { ok: false, error: "GAS login failed" },
      { status: 500 }
    );
  }

  return Response.json({ ok: true });
}