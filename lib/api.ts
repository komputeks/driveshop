export async function api<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
    body: options?.body
      ? JSON.stringify(options.body)
      : undefined,
  });

  if (!res.ok) {
    throw new Error("API request failed");
  }

  return res.json();
}