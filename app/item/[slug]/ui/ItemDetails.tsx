import { useState, useEffect } from "react";
import type { ItemWithSlug } from "@/lib/types";
import { api } from "@/lib/api";

type Props = {
  slug: string;
};

export default function ItemDetails({ slug }: Props) {
  const [item, setItem] = useState<ItemWithSlug | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchItem() {
      setLoading(true);
      try {
        const res = await api<{ item: ItemWithSlug }>(
          `/api/item-by-slug?slug=${slug}`
        );
        setItem(res.item);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchItem();
  }, [slug]);

  if (loading) return <div>Loading item…</div>;
  if (!item) return <div className="text-gray-400">Item not found</div>;

  return (
    <div className="space-y-4">
      <img
        src={item.cdn}
        alt={item.name}
        className="rounded w-full"
      />
      <h1 className="text-2xl font-semibold">{item.name}</h1>
      {item.description && (
        <p className="text-gray-600">{item.description}</p>
      )}
    </div>
  );
}