// lib/api.ts

export function getApiUrl() {

  const url = process.enNEXT_PUBLIC_API_BASE_URL;

  if (!url) {
    console.error("❌ Missing NEXT_PUBLIC_API_BASE_URL");
    return null;
  }

  return url;
}

export async function fetchItems(params?: {
  q?: string;
  category?: string;
}) {

  const API = getApiUrl();

  if (!API) {
    return {
      items: [],
      error: "API not configured",
    };
  }

  try {

    const url = new URL(API);

    url.searchParams.set("path", "items");

    if (params?.q) {
      url.searchParams.set("q", params.q);
    }

    if (params?.category) {
      url.searchParams.set("cat", params.category);
    }

    const res = await fetch(url.toString(), {
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("❌ API status:", res.status);
      return { items: [] };
    }

    const text = await res.text();

    // Protect against HTML error pages
    if (!text.startsWith("{")) {
      console.error("❌ Invalid API response:", text.slice(0, 200));
      return { items: [] };
    }

    return JSON.parse(text);

  } catch (err) {

    console.error("❌ fetchItems failed:", err);

    return {
      items: [],
      error: "Fetch failed",
    };
  }
}