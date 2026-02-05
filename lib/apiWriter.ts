import crypto from "crypto";
import type { SignedPayload } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
const API_SECRET = process.env.API_SIGNING_SECRET!;

/**
 * Send a signed POST request to your API
 * @param action - action name for your backend
 * @param endpoint - API route (relative path)
 * @param payload - data to send
 */
export async function apiWrite(
  action: string,
  endpoint: string,
  payload: Record<string, any>
) {
  const ts = Date.now();
  const nonce = crypto.randomUUID();

  const rawPayload = JSON.stringify(payload);

  const signature = crypto
    .createHmac("sha256", API_SECRET)
    .update(`${action}|POST|${ts}|${nonce}|${rawPayload}`)
    .digest("hex");

  const signed: SignedPayload = {
    action,
    timestamp: ts,
    nonce,
    signature,
    payload: rawPayload,
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(signed),
  });

  return res.json();
}