"use client";

import Link from "next/link";
import Image from "next/image";
import { Item } from "@/lib/types";
import { buildItemSlug } from "@/lib/slug";

interface ItemsGridProps {
  items: Item[];
}

export function ItemsGrid({ items }: ItemsGridProps) {
  if (!items.length) {
    return (
      <div className="text-center py-20 text-gray-500">
        No items found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {items.map((item) => {
        const href = buildItemSlug(item);

        return (
          <Link
            key={item.id}
            href={href}
            className="group block rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition"
          >
            <div className="relative aspect-square bg-gray-100">
              <Image
                src={item.cdn}
                alt={item.name}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover group-hover:scale-105 transition"
              />
            </div>

            <div className="p-2">
              <div className="text-sm font-medium truncate">
                {item.name}
              </div>

              <div className="text-xs text-gray-500 mt-1 flex gap-3">
                <span>👁 {item.views}</span>
                <span>❤️ {item.likes}</span>
                <span>💬 {item.comments}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}


