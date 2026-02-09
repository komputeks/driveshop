// pages/api/categories.ts
import type { NextApiRequest, NextApiResponse } from "next";

interface Category {
  name: string;
  children?: string[];
}

interface ApiResponse {
  ok: boolean;
  categories?: Category[];
  error?: string;
}

// Use your GAS endpoint from env
const GAS_CATEGORIES_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}?action=getCategories`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const response = await fetch(GAS_CATEGORIES_URL);
    const data = await response.json();

    if (!data.ok || !data.categories) {
      return res.status(500).json({ ok: false, error: "Failed to fetch categories" });
    }

    // Transform GAS data into children array
    const categories: Category[] = data.categories.map((cat: string) => ({
      name: cat,
      // For now we leave children empty; can fetch subcategories later if needed
      children: []
    }));

    res.status(200).json({ ok: true, categories });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message || "Unknown error" });
  }
}