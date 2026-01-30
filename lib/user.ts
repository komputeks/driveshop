const GAS = process.env.NEXT_PUBLIC_GAS_URL!;

let cache: any = null;
let last = 0;

export async function getUser(email: string) {
  const now = Date.now();

  if (cache && now - last < 60_000) {
    return cache;
  }

  const res = await fetch(GAS + "?path=user/get", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
    cache: "no-store",
  });

  const data = await res.json();

  cache = data;
  last = now;

  return data;
}

export async function updateUser(data: any) {
  return fetch(GAS + "?path=user/update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}