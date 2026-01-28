import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST() {

  revalidatePath("/");
  revalidatePath("/category");
  revalidatePath("/search");

  return NextResponse.json({ ok: true });
}