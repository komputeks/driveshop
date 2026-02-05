import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { ItemStats, StatsResponse } from "@/lib/types";

async function fetchItemEventsFromGAS(slug: string) {
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}?action=itemEvents&slug=${encodeURIComponent(slug)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch item events");

  const json = await res.json();
  // json.events should be EventRow[] from GAS
  return json.events || [];
}

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get("slug");
    if (!slug) return NextResponse.json({ ok: false, error: "Missing slug" }, { status: 400 });

    // Get current logged-in user
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;

    // Fetch all events from GAS
    const events: any[] = await fetchItemEventsFromGAS(slug);

    // Compute stats
    const stats: ItemStats = {
      views: events.filter(e => e.type === "view").length,
      likes: events.filter(e => e.type === "like" && e.value === "1").length,
      comments: events.filter(e => e.type === "comment" && e.value !== "[deleted]").length,
    };

    // Check if current user has liked
    const hasLiked = email
      ? events.some(e => e.type === "like" && e.userEmail === email && e.value === "1")
      : false;

    const payload: StatsResponse & { hasLiked: boolean } = {
      ok: true,
      stats,
      hasLiked,
    };

    return NextResponse.json(payload);

  } catch (err) {
    console.error("GET /api/item-events failed:", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}