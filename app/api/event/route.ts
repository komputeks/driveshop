import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action, itemSlug, value, eventId } = body;

    if (!itemSlug) return NextResponse.json({ ok: false, error: "Missing itemSlug" }, { status: 400 });

    // 🔗 Map actions to GAS
    let payload: any = { action: "", itemId: itemSlug, userEmail: email };
    switch (action) {
      case "like":
        payload.action = "events.upsert";
        payload.type = "like";
        payload.value = "1";
        break;
      case "unlike":
        payload.action = "events.remove";
        payload.type = "like";
        break;
      case "comment":
        payload.action = "events.upsert";
        payload.type = "comment";
        payload.value = value;
        break;
      case "edit":
        payload.action = "events.upsert";
        payload.type = "comment";
        payload.value = value;
        payload.eventId = eventId;
        break;
      case "delete":
        payload.action = "events.remove";
        payload.type = "comment";
        payload.eventId = eventId;
        break;
      default:
        return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });
    }

    // Call GAS endpoint
    const res = await fetch(process.env.NEXT_PUBLIC_API_BASE_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      return NextResponse.json({ ok: false, error: data.error || "GAS failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("POST /api/event failed:", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}