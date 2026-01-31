// lib/api.ts
// Central GAS API client

const GAS_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function callGAS(
  path: string,
  data?: any
) {
  if (!GAS_URL) {
    throw new Error("Missing GAS URL");
  }

  const url = new URL(GAS_URL);
  url.searchParams.set("path", path);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data || {}),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error("GAS Error: " + text);
  }

  return res.json();
}