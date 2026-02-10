// @/lib/typedFetch.ts
import { ApiResponse, ApiOk, assertOk } from "@/lib/types";
import { safePayload } from "@/lib/safePayload";
import { errorStore } from "@/lib/ErrorStore";

type FetchInit = RequestInit & { action: string; payload?: unknown };

/* =========================
   CLIENT-SIDE FETCH
========================= */
export async function apiFetch<T>(input: RequestInfo, init: FetchInit): Promise<ApiOk<T>> {
  const action = init.action;
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

      errorStore.push({
        time: new Date().toLocaleTimeString(),
        label: "API Error",
        message: err.message,
        action,
        payload: init.payload && safePayload(init.payload),
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
export async function apiFetchServer<T>(url: string, init: FetchInit): Promise<ApiOk<T>> {
  const action = init.action;
  const start = Date.now();

  try {
    const res = await fetch(url, init);
    const durationMs = Date.now() - start;

    if (!res.ok) {
      const text = await res.text();
      const err: any = new Error(`HTTP ${res.status}`);
      err.action = action;
      err.durationMs = durationMs;
      err.response = text;

      // Server-side: still push structured error, but overlay can read it when response sent to client
      errorStore.push({
        time: new Date().toLocaleTimeString(),
        label: "API Error (Server)",
        message: err.message,
        action,
        payload: init.payload && safePayload(init.payload),
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
      err.payload = init.payload && safePayload(init.payload);
      err.response = safePayload(json);

      errorStore.push({
        time: new Date().toLocaleTimeString(),
        label: "API Error (Server)",
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
    err.durationMs ??= Date.now() - start;

    errorStore.push({
      time: new Date().toLocaleTimeString(),
      label: "API Error (Server)",
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