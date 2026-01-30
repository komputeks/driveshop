const GAS = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function callGas(path: string, body: any) {

  if (!GAS) {
    throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
  }

  const url = new URL(GAS);
  url.searchParams.set("path", path);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body || {}),
    cache: "no-store",
  });

  if (!res.ok) {
    const t = await res.text();
    console.error("GAS error:", t);
    throw new Error("GAS error");
  }

  return res.json();
}