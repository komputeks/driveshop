import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {

    const body = await req.json();

    if (body.secret !== process.env.NEXTJS_ISR_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Revalidate main routes
    revalidatePath("/");
    revalidatePath("/search");
    revalidatePath("/category");
    revalidatePath("/profile");
    revalidatePath("/admin");

    return NextResponse.json({
      revalidated: true,
      time: Date.now()
    });

  } catch (e: any) {

    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}