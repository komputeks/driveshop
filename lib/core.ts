const GAS = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function callGas(path: string, body: any) {
  const res = await fetch(GAS + "?path=" + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) throw new Error("GAS error");

  return res.json();
}