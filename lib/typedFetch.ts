// @/lib/typedFetch.ts
import { ApiResponse, ApiOk, assertOk } from "@/lib/types";
import { safePayload } from "@/lib/safePayload";
import { pushError } from "./ErrorStore";

export async function apiFetch<T>(
  input: RequestInfo,
  init?: RequestInit & { action?: string; payload?: unknown }
): Promise<ApiOk<T>> {
  const action = init?.action;
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

      // Push to overlay
      pushError({
        time: new Date().toLocaleTimeString(),
        label: "API Error",
        message: err.message,
        action,
        payload: init?.payload && safePayload(init.payload),
        response: text ? safePayload(text) : undefined,
        durationMs,
      });

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

      pushError({
        time: new Date().toLocaleTimeString(),
        label: "API Error",
        message: err.message,
        action,
        payload: err.payload,
        response: err.response,
        durationMs,
      });

      throw err;
    }

    return json;
  } catch (err: any) {
    err.action ??= action;
    err.durationMs ??= Math.round(performance.now() - start);

    // Push any unexpected fetch errors
    pushError({
      time: new Date().toLocaleTimeString(),
      label: "API Error",
      message: err.message ?? String(err),
      action: err.action,
      payload: init?.payload && safePayload(init.payload),
      response: err.response ? safePayload(err.response) : undefined,
      durationMs: err.durationMs,
      stack: err.stack,
    });

    throw err;
  }
}

/* =========================
   RAW GET
========================= */
// @/lib/typedFetch.ts
export async function apiGet<T>(
  url: string,
  action?: string
): Promise<T> {
  const start = performance.now();

  try {
    const res = await fetch(url, { cache: "no-store" });
    const durationMs = Math.round(performance.now() - start);

    if (!res.ok) {
      const err: any = new Error(`HTTP ${res.status}`);
      err.action = action;
      err.durationMs = durationMs;

      // Push to overlay
      pushError({
        time: new Date().toLocaleTimeString(),
        label: "API Error",
        message: err.message,
        action,
        response: await res.text(),
        durationMs,
      });

      throw err;
    }

    return res.json();
  } catch (err: any) {
    err.action ??= action;
    err.durationMs ??= Math.round(performance.now() - start);

    pushError({
      time: new Date().toLocaleTimeString(),
      label: "API Error",
      message: err.message ?? String(err),
      action,
      response: err.response ? safePayload(err.response) : undefined,
      durationMs: err.durationMs,
      stack: err.stack,
    });

    throw err;
  }
}