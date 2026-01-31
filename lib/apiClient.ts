const GAS = process.env.NEXT_PUBLIC_API_BASE_URL!;

export async function fetchDashboard(email: string) {
  const res = await fetch(GAS + "?path=user/dashboard", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Dashboard fetch failed");
  }

  return res.json();
}

export async function updateProfile(data: any) {
  return fetch(GAS + "?path=user/update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

