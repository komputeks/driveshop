const GAS = process.env.NEXT_PUBLIC_GAS_URL!;

export async function getUserActivity(email: string) {

  const res = await fetch(GAS + "?path=user/activity", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
    cache: "no-store",
  });

  return res.json();
}