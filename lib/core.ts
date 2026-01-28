import crypto from "crypto";

export async function callGas(path: string, payload: any) {
  const ts = Date.now().toString();

  // HMAC signature using your API_SIGNING_SECRET
  const secret = process.env.API_SIGNING_SECRET!;
  const sig = crypto
    .createHmac("sha256", secret)
    .update(ts + JSON.stringify(payload || {}))
    .digest("hex");

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ts": ts,
      "x-sig": sig
    },
    body: JSON.stringify(payload || {})
  });

  return res.json();
}