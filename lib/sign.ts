// lib/sign.ts
export async function sign(action: string, payload: any) {
  const ts = Date.now();
  const nonce = crypto.randomUUID();

  const base = [
    action,
    "POST",
    ts,
    nonce,
    JSON.stringify(payload)
  ].join("|");

  const signature = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(
      base + process.env.NEXT_PUBLIC_API_SIGNING_SECRET
    )
  );

  return {
    "x-action": action,
    "x-ts": ts.toString(),
    "x-nonce": nonce,
    "x-signature": btoa(
      String.fromCharCode(...new Uint8Array(signature))
    )
  };
}