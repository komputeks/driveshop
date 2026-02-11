import { ItemWithSlug } from "@/lib/types";


export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function buildItemSlug(item: {
  name: string;
  cat1: string;
  cat2: string;
}) {
  return `/${slugify(item.cat1)}/${slugify(item.cat2)}/${slugify(item.name)}`;
}