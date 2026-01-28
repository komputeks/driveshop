export async function callGas(path: string, payload: any) {
  const ts = Date.now().toString();
  const sig = Utilities.sign(ts + JSON.stringify(payload || {})); // pseudo
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-ts": ts,
      "x-sig": sig
    },
    body: JSON.stringify(payload)
  });
  return res.json();
}