import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Security check
    if (body.secret !== process.env.NEXTJS_ISR_SECRET) {
      return NextResponse.json(
        { error: "Invalid secret" },
        { status: 401 }
      );
    }

    // Revalidate important pages
    await Promise.all([
      revalidatePath("/"),
      revalidatePath("/dashboard"),
    ]);

    return NextResponse.json({
      success: true,
      revalidated: true,
      timestamp: Date.now(),
    });

  } catch (err) {
    console.error("Revalidate error:", err);

    return NextResponse.json(
      { error: "Revalidation failed" },
      { status: 500 }
    );
  }
}