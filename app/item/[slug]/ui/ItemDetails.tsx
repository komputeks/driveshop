import { api } from "@/lib/api";
import type { SlugProps } from "@/lib/types";

export default async function ItemPage({ slug }: SlugProps) {
  const { item } = await api(`/api/item-by-slug?slug=${slug}`);

  return (
    <div>
      <img
        src={item.cdn}
        alt={item.name}
        className="rounded w-full"
      />

      <h1 className="text-2xl font-semibold mt-4">
        {item.name}
      </h1>

      {item.description && (
        <p className="text-gray-600 mt-2">
          {item.description}
        </p>
      )}
    </div>
  );
}