// lib/apiWrite.ts
import { sign } from "./sign";

export async function apiWrite(
  action: string,
  url: string,
  payload: any
) {
  const headers = await sign(action, payload);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error("Write failed");

  return res.json();
}