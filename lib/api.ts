export async function callGAS(action: string, data: any) {
  const res = await fetch("/api/gas", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action,
      ...data,
    }),
  });

  return res.json();
}