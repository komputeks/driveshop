// components/CategoryDropdown.tsx
"use client";

import { useEffect, useState } from "react";
import { CategoryTree, CategoryTreeNode, CategoryTreeResponse } from "@/lib/types";

export default function CategoryDropdown() {
  const [categories, setCategories] = useState<CategoryTree>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch category tree from API
  useEffect(() => {
    setLoading(true);
    fetch("/api/categories")
      .then(res => res.json())
      .then((data: CategoryTreeResponse) => {
        if (data.ok) setCategories(data.data.categories);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleMenu = () => setOpen(prev => !prev);

  const renderChildren = (children: CategoryTreeNode[]) => {
    return children.map(c => (
      <li key={c.slug}>
        <a href={`/category/${c.slug}`} className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800">
          {c.name}
        </a>
        {c.children.length > 0 && (
          <ul className="pl-4">{renderChildren(c.children)}</ul>
        )}
      </li>
    ));
  };

  return (
    <div className="relative inline-block text-left">
      {/* Mobile / Toggle button */}
      <button
        onClick={toggleMenu}
        className="btn btn-primary md:hidden"
        aria-expanded={open}
      >
        Categories
      </button>

      {/* Desktop / Menu */}
      <div className="hidden md:block">
        <ul className="flex space-x-4">
          {loading ? (
            <li className="text-gray-500">Loading...</li>
          ) : (
            categories.map(cat => (
              <li key={cat.slug} className="relative group">
                <a
                  href={`/category/${cat.slug}`}
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {cat.name}
                </a>
                {cat.children.length > 0 && (
                  <ul className="absolute left-0 mt-2 w-48 rounded-md bg-white dark:bg-slate-950 shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                    {renderChildren(cat.children)}
                  </ul>
                )}
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Mobile / Dropdown Panel */}
      {open && (
        <div className="absolute top-full left-0 w-56 bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-700 shadow-lg rounded-md mt-2 z-50 animate-slide-in">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <li className="px-4 py-2 text-gray-500">Loading...</li>
            ) : (
              categories.map(cat => (
                <li key={cat.slug} className="px-4 py-2">
                  <a href={`/category/${cat.slug}`} className="block font-medium">
                    {cat.name}
                  </a>
                  {cat.children.length > 0 && (
                    <ul className="pl-4 mt-1">{renderChildren(cat.children)}</ul>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}