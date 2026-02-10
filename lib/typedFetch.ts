// @/lib/typedFetch.ts

import { ApiResponse, ApiOk, assertOk } from "@/lib/types";
import { safePayload } from "@/lib/safePayload";

/* =========================
   HELPERS
========================= */

function inferAction(input: RequestInfo): string | undefined {
  if (typeof input !== "string") return;

  try {
    const url = new URL(input, window.location.origin);

    // /api/category-tree      -> category-tree
    // /api/items/slug         -> items
    const parts = url.pathname.split("/").filter(Boolean);
    const apiIndex = parts.indexOf("api");

    return apiIndex >= 0 ? parts[apiIndex + 1] : undefined;
  } catch {
    return;
  }
}

/* =========================
   TYPED FETCH
========================= */

export async function apiFetch<T>(
  input: RequestInfo,
  init?: RequestInit & { action?: string; payload?: unknown }
): Promise<ApiOk<T>> {
  const action = init?.action ?? inferAction(input);
  const start = performance.now();

  try {
    const res = await fetch(input, init);

    const durationMs = Math.round(performance.now() - start);

    if (!res.ok) {
      const text = await res.text();
      const err: any = new Error(`HTTP ${res.status}`);

      err.action = action;
      err.durationMs = durationMs;
      err.response = text;

      throw err;
    }

    const json = (await res.json()) as ApiResponse<T>;

    try {
      assertOk(json);
    } catch (err: any) {
      err.action = action;
      err.durationMs = durationMs;
      err.payload = init?.payload && safePayload(init.payload);
      err.response = safePayload(json);
      throw err;
    }

    return json;
  } catch (err: any) {
    if (err && typeof err === "object") {
      err.action ??= action;
      err.durationMs ??= Math.round(performance.now() - start);
    }

    console.error("[apiFetch]", err);
    throw err; // never swallow
  }
}

/* =========================
   RAW GET
========================= */

export async function apiGet<T>(url: string): Promise<T> {
  const start = performance.now();

  try {
    const res = await fetch(url, { cache: "no-store" });
    const durationMs = Math.round(performance.now() - start);

    if (!res.ok) {
      const err: any = new Error(`HTTP ${res.status}`);
      err.durationMs = durationMs;
      err.action = inferAction(url);
      throw err;
    }

    return res.json();
  } catch (err: any) {
    err.durationMs ??= Math.round(performance.now() - start);
    err.action ??= inferAction(url);

    console.error("[apiGet] Failed", err);
    throw err;
  }
}