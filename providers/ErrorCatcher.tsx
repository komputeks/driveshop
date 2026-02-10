"use client";

// @/providers/ErrorCatcher

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { errorStore, ApiOverlayError } from "@/lib/ErrorStore";
import { safePayload } from "@/lib/safePayload";

export function ErrorCatcher() {
  const [errors, setErrors] = useState<ApiOverlayError[]>([]);
  const pathname = usePathname();
  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    // Subscribe to error store
    const unsubscribe = errorStore.subscribe(setErrors);

    // ---------------- JS runtime errors ----------------
    const onError = (msg: any, url: string, line: number, col: number, error: any) => {
      errorStore.push({
        time: new Date().toLocaleTimeString(),
        label: "JS Error",
        message: String(msg),
        route: pathname,
        file: url,
        line,
        col,
        stack: isDev ? error?.stack : undefined,
        action: error?.action,
        payload: error?.payload && safePayload(error.payload),
        response: error?.response && safePayload(error.response),
        durationMs: error?.durationMs,
      });

      console.error("[JS Error]", error);
      return false;
    };

    // ---------------- Promise rejections ----------------
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;

      errorStore.push({
        time: new Date().toLocaleTimeString(),
        label: "Promise Rejection",
        message: reason instanceof Error ? reason.message : String(reason),
        route: pathname,
        stack: isDev && reason instanceof Error ? reason.stack : undefined,
        action: reason?.action,
        payload: reason?.payload && safePayload(reason.payload),
        response: reason?.response && safePayload(reason.response),
        durationMs: reason?.durationMs,
      });

      console.error("[Unhandled Promise Rejection]", reason);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    // Cleanup
    return () => {
      unsubscribe();
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, [pathname, isDev]);

  if (errors.length === 0) return null;

function copyError(err: ApiOverlayError) {
const text = `
Time: ${err.time}
Route: ${err.route}
Action: ${err.action ?? "—"}
Duration: ${err.durationMs ?? "—"}ms

Message:
${err.message}

Payload:
${err.payload ?? "—"}

Response:
${err.response ?? "—"}

Stack:
${err.stack ?? "—"}
    `.trim();

    navigator.clipboard.writeText(text);
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 12,
        right: 12,
        width: 480,
        maxHeight: "65vh",
        overflowY: "auto",
        background: "#0b0b0b",
        color: "#f87171",
        fontSize: 12,
        fontFamily: "monospace",
        zIndex: 99999,
        borderRadius: 8,
        boxShadow: "0 0 0 1px rgba(255,255,255,0.1)",
      }}
    >
      {/* ---------- HEADER ---------- */}
      <div
        style={{
          padding: "8px 10px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "#fff",
        }}
      >
        <strong>Error Overlay</strong>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => copyError(errors[0])}
            style={btnStyle}
          >
            Copy latest error
          </button>
          <button
            onClick={() => setErrors([])}
            style={btnStyle}
          >
            Clear overlay
          </button>
        </div>
      </div>

      {/* ---------- ERRORS ---------- */}
      {errors.map((e, i) => (
        <div
          key={i}
          style={{
            padding: 10,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ color: "#9ca3af", marginBottom: 4 }}>
            [{e.time}] {e.label} {e.durationMs != null && `(${e.durationMs}ms)`}
          </div>

          {e.route && (
            <div style={{ color: "#60a5fa" }}>
              route: {e.route}
            </div>
          )}
          {e.action && (
            <div style={{ color: "#fbbf24" }}>
              action: {e.action}
            </div>
          )}

          <div style={{ whiteSpace: "pre-wrap", marginTop: 4 }}>
            {e.message}
          </div>

          {e.payload && (
            <pre style={{ color: "#38bdf8", marginTop: 4 }}>
              {e.payload}
            </pre>
          )}

          {e.response && (
            <pre style={{ color: "#f472b6", marginTop: 4 }}>
              {e.response}
            </pre>
          )}

          {e.stack && (
            <pre style={{ marginTop: 6, color: "#fca5a5", whiteSpace: "pre-wrap" }}>
              {e.stack}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#9ca3af",
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 4,
  padding: "2px 6px",
  cursor: "pointer",
};