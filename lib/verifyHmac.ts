import crypto from "crypto";

const MAX_SKEW_MS = 5 * 60 * 1000;

export async function verifyHmac(
  req: Request,
  allowedActions: string[]
) {
  const secret = process.env.NEXTJS_HMAC_SECRET!;
  const action = req.headers.get("x-action");
  const sig = req.headers.get("x-signature");
  const ts = req.headers.get("x-timestamp");

  if (!action || !sig || !ts) {
    throw new Error("Missing HMAC headers");
  }

  if (!allowedActions.includes(action)) {
    throw new Error("Action not allowed");
  }

  const timestamp = Number(ts);
  if (!timestamp || Math.abs(Date.now() - timestamp) > MAX_SKEW_MS) {
    throw new Error("Expired request");
  }

  const body = await req.text();

  const expected = crypto
    .createHmac("sha256", secret)
    .update(action + "." + ts + "." + body)
    .digest("hex");

  const valid = crypto.timingSafeEqual(
    Buffer.from(sig, "hex"),
    Buffer.from(expected, "hex")
  );

  if (!valid) {
    throw new Error("Invalid signature");
  }

  return { action, body: JSON.parse(body) };
}