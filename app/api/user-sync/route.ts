import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return Response.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({}));

  const payload = {
    action: "login",
    email: session.user.email,
    name: body.name || session.user.name || "",
    photo: body.photo || session.user.image || "",
  };

  const res = await fetch(process.env.NEXT_PUBLIC_API_BASE_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
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