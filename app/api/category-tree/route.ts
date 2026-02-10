// app/api/category-tree/route.ts
import { NextResponse } from "next/server";
import { apiFetchServer } from "@/lib/typedFetch";
import { withApiErrorOverlay } from "@/lib/withApiErrorOverlay";
import type { CategoryTreeResponse } from "@/lib/types";

const GAS_ENDPOINT = process.env.NEXT_PUBLIC_API_BASE_URL!;

export const GET = withApiErrorOverlay(async () => {
  const action = "category-tree";

  // Use server-side fetch
  const data = await apiFetchServer<CategoryTreeResponse>(
    `${GAS_ENDPOINT}?action=${action}`,
    { action }
  );

  return data;
});