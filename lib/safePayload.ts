// @/lib/safePayload.ts
export function safePayload(payload: unknown) {
  try {
    const json = JSON.stringify(payload, (_k, v) =>
      typeof v === "string" && v.length > 500 ? v.slice(0, 500) + "…" : v
    );

    return json.length > 2000 ? json.slice(0, 2000) + "…" : json;
  } catch {
    return "[Unserializable payload]";
  }
}