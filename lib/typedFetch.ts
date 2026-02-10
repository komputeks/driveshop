// @/lib/typedFetch.ts
import { ApiResponse, ApiOk, assertOk } from "@/lib/types";
import { safePayload } from "@/lib/safePayload";
import { errorStore } from "@/lib/ErrorStore";

type FetchInit = RequestInit & { action: string; payload?: unknown };

/* =========================
   SERVER-SIDE FETCH HELPER
========================= */
export function withApiErrorOverlay<T>(fn: () => Promise<T>) {
  try {
    return fn();
  } catch (err: any) {
    // Build overlay payload
    const overlay = {
      time: new Date().toLocaleTimeString(),
      label: "API Error (Server)",
      message: err.message ?? String(err),
      action: err.action,
      payload: err.payload ? safePayload(err.payload) : undefined,
      response: err.response ? safePayload(err.response) : undefined,
      durationMs: err.durationMs,
      stack: err.stack,
    };

    // In dev mode, push immediately to errorStore for client overlay
    if (typeof window !== "undefined") {
      errorStore.push(overlay);
    }

    // Also return for client overlay via __overlay
    return { __overlay: overlay } as any;
  }
}

/* =========================
   CLIENT-SIDE FETCH
========================= */
export async function apiFetch<T>(input: RequestInfo, init: FetchInit): Promise<ApiOk<T>> {
  const action = init.action;
  const start = performance.now();

  try {
    const res = await fetch(input, init);
    const durationMs = Math.round(performance.now() - start);
    const json: ApiResponse<T> & { __overlay?: any } = await res.json();

    // If server sent __overlay, push it to overlay store
    if (json.__overlay) {
      errorStore.push(json.__overlay);
    }

    if (!res.ok) {
      const err: any = new Error(`HTTP ${res.status}`);
      err.action = action;
      err.durationMs = durationMs;
      err.response = json;

      errorStore.push({
        time: new Date().toLocaleTimeString(),
        label: "API Error",
        message: err.message,
        action,
        payload: init.payload && safePayload(init.payload),
        response: json ? safePayload(json) : undefined,
        durationMs,
      });

      throw err;
    }

    try {
      assertOk(json);
    } catch (err: any) {
      err.action = action;
      err.durationMs = durationMs;
      err.payload = init.payload && safePayload(init.payload);
      err.response = safePayload(json);

      errorStore.push({
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

    errorStore.push({
      time: new Date().toLocaleTimeString(),
      label: "API Error",
      message: err.message ?? String(err),
      action: err.action,
      payload: init.payload && safePayload(init.payload),
      response: err.response ? safePayload(err.response) : undefined,
      durationMs: err.durationMs,
      stack: err.stack,
    });

    throw err;
  }
}

/* =========================
   SERVER-SIDE FETCH
========================= */
export async function apiFetchServer<T>(url: string, init: FetchInit): Promise<ApiOk<T> & { __overlay?: any }> {
  const action = init.action;
  const start = Date.now();

  try {
    const res = await fetch(url, init);
    const durationMs = Date.now() - start;

    const json = (await res.json()) as ApiResponse<T>;

    try {
      assertOk(json);
    } catch (err: any) {
      err.action = action;
      err.durationMs = durationMs;
      err.payload = init.payload && safePayload(init.payload);
      err.response = safePayload(json);

      // Wrap for overlay forwarding
      return { __overlay: { 
        time: new Date().toLocaleTimeString(),
        label: "API Error (Server)",
        message: err.message,
        action,
        payload: err.payload,
        response: err.response,
        durationMs,
      }} as any;
    }

    return json;
  } catch (err: any) {
    // Wrap fetch/network errors for overlay forwarding
    return { __overlay: { 
      time: new Date().toLocaleTimeString(),
      label: "API Error (Server)",
      message: err.message ?? String(err),
      action: err.action ?? action,
      payload: init.payload && safePayload(init.payload),
      response: err.response ? safePayload(err.response) : undefined,
      durationMs: Date.now() - start,
      stack: err.stack,
    }} as any;
  }
}