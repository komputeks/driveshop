"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { safePayload } from "@/lib/safePayload";

type CapturedError = {
  time: string;
  label: string;
  message: string;
  route?: string;
  action?: string;
  durationMs?: number;
  file?: string;
  line?: number;
  col?: number;
  stack?: string;
  payload?: string;
  response?: string;
};

export function ErrorCatcher() {
  const [errors, setErrors] = useState<CapturedError[]>([]);
  const pathname = usePathname();
  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    function pushError(err: CapturedError) {
      setErrors(prev => [err, ...prev].slice(0, 25));
    }

    // ---------------- JS runtime errors ----------------
    window.onerror = function (msg, url, line, col, error) {
      console.error("[JS Error]", { msg, url, line, col, error });

      const e: any = error;

      pushError({
        time: new Date().toLocaleTimeString(),
        label: "JS Error",
        message: String(msg),
        route: pathname,
        file: url,
        line,
        col,
        stack: isDev ? e?.stack : undefined,
        action: e?.action,
        durationMs: e?.durationMs,
        payload: e?.payload && safePayload(e.payload),
        response: e?.response && safePayload(e.response),
      });

      return false;
    };

    // ---------------- Promise rejections ----------------
    window.onunhandledrejection = function (event) {
      console.error("[Unhandled Promise Rejection]", event.reason);

      const reason: any = event.reason;

      pushError({
        time: new Date().toLocaleTimeString(),
        label: "Promise Rejection",
        message:
          reason instanceof Error ? reason.message : String(reason),
        route: pathname,
        stack:
          isDev && reason instanceof Error ? reason.stack : undefined,
        action: reason?.action,
        durationMs: reason?.durationMs,
        payload: reason?.payload && safePayload(reason.payload),
        response: reason?.response && safePayload(reason.response),
      });
    };

    return () => {
      window.onerror = null;
      window.onunhandledrejection = null;
    };
  }, [pathname, isDev]);

  if (errors.length === 0) return null;

  const latest = errors[0];

  function copyError(err: CapturedError) {
    const text = `
Time: ${err.time}
Route: ${err.route ?? "—"}
Action: ${err.action ?? "—"}
Duration: ${err.durationMs != null ? `${err.durationMs} ms` : "—"}

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
        width: 460,
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
            onClick={() => copyError(latest)}
            className="text-xs underline text-blue-400"
          >
            Copy error
          </button>
          <button
            onClick={() => setErrors([])}
            style={btnStyle}
          >
            clear overlay
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
            [{e.time}] {e.label}
          </div>

          {e.route && (
            <div style={{ color: "#60a5fa" }}>
              route: {e.route}
            </div>
          )}

          {e.action && (
            <div style={{ color: "#34d399" }}>
              action: {e.action}
            </div>
          )}

          {e.durationMs != null && (
            <div style={{ color: "#facc15" }}>
              ⏱ {e.durationMs} ms
            </div>
          )}

          <div style={{ whiteSpace: "pre-wrap", marginTop: 4 }}>
            {e.message}
          </div>

          {e.file && (
            <div style={{ marginTop: 4 }}>
              <a
                href={isDev ? e.file : undefined}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: "#34d399",
                  textDecoration: "underline",
                  pointerEvents: isDev ? "auto" : "none",
                }}
              >
                {e.file}
                {e.line != null && `:${e.line}`}
                {e.col != null && `:${e.col}`}
              </a>
            </div>
          )}

          {e.payload && (
            <pre style={{ marginTop: 6, color: "#93c5fd" }}>
              Payload:
              {"\n"}
              {e.payload}
            </pre>
          )}

          {e.response && (
            <pre style={{ marginTop: 6, color: "#fca5a5" }}>
              Response:
              {"\n"}
              {e.response}
            </pre>
          )}

          {e.stack && (
            <pre
              style={{
                marginTop: 6,
                color: "#fca5a5",
                whiteSpace: "pre-wrap",
              }}
            >
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