// @/lib/slug.ts

import type { Item } from "@/lib/types";

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

export function buildItemSlug(item: Item) {
  if (!item.cat2) {
    throw new Error(`Item ${item.id} is missing cat2`);
  }

  return `/${slugify(item.cat1)}/${slugify(item.cat2)}/${slugify(item.name)}`;
}