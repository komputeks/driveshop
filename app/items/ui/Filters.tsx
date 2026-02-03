"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCategories } from "@/lib/hooks/useCategories";
import { useState } from "react";

export default function Filters() {
  const { categories } = useCategories();
  const params = useSearchParams();
  const router = useRouter();

  const [search, setSearch] = useState(
    params.get("search") || ""
  );

  const cat1 = params.get("cat1");
  const cat2 = params.get("cat2");

  const update = (next: Record<string, string | null>) => {
    const q = new URLSearchParams(params.toString());

    Object.entries(next).forEach(([k, v]) => {
      if (v) q.set(k, v);
      else q.delete(k);
    });

    q.delete("page"); // reset pagination
    router.push(`/items?${q.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter") {
            update({ search });
          }
        }}
        placeholder="Search items…"
        className="w-full border rounded p-2"
      />

      {/* Categories */}
      <div className="space-y-2">
        {categories.map(c => (
          <div key={c.slug}>
            <button
              onClick={() =>
                update({
                  cat1: c.slug,
                  cat2: null
                })
              }
              className={`block font-medium ${
                cat1 === c.slug ? "text-black" : "text-gray-500"
              }`}
            >
              {c.name}
            </button>

            {/* Subcategories */}
            {cat1 === c.slug && c.children?.length > 0 && (
              <div className="ml-4 space-y-1">
                {c.children.map(sc => (
                  <button
                    key={sc.slug}
                    onClick={() =>
                      update({
                        cat1: c.slug,
                        cat2: sc.slug
                      })
                    }
                    className={`block text-sm ${
                      cat2 === sc.slug
                        ? "text-black"
                        : "text-gray-400"
                    }`}
                  >
                    {sc.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Clear */}
      {(cat1 || cat2 || search) && (
        <button
          onClick={() => router.push("/items")}
          className="text-sm text-red-500"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}