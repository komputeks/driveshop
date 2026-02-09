"use client";

import { useEffect, useState } from "react";
import { CategoryTreeNode } from "@/lib/types";

export default function CategoryMenu() {
  const [categories, setCategories] = useState<CategoryTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();

        if (!data.ok || !data.data?.categories) {
          throw new Error("Failed to fetch categories");
        }

        setCategories(data.data.categories);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  if (loading) return <div className="p-4">Loading categories…</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <ul className="space-y-2">
      {categories.map(cat => (
        <CategoryItem key={cat.slug} node={cat} />
      ))}
    </ul>
  );
}

interface CategoryItemProps {
  node: CategoryTreeNode;
}

function CategoryItem({ node }: CategoryItemProps) {
  const hasChildren = node.children && node.children.length > 0;
  const [open, setOpen] = useState(false);

  return (
    <li>
      <div
        className="flex justify-between items-center surface-clickable p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
        onClick={() => hasChildren && setOpen(!open)}
      >
        <a href={`/${node.slug}`} className="font-medium text-slate-900 dark:text-slate-100">
          {node.name}
        </a>
        {hasChildren && (
          <span className={`ml-2 transition-transform ${open ? "rotate-90" : ""}`}>▶</span>
        )}
      </div>

      {hasChildren && open && (
        <ul className="ml-4 mt-1 border-l border-gray-200 dark:border-gray-700 pl-2 space-y-1">
          {node.children.map(child => (
            <CategoryItem key={child.slug} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}