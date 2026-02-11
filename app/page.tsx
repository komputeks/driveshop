export default async function HomePage() {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL!;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "items.list",
      page: 1,
      limit: 40,
    }),
  });

  const json = await res.json();

  return (
    <pre>{JSON.stringify(json, null, 2)}</pre>
  );
}