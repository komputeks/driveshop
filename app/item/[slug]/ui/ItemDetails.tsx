import { api } from "@/lib/api";
import type { ItemDetailsResponse } from "@/lib/types";

type PageProps = {
  params: {
    slug: string;
  };
};

export default async function ItemPage({ params }: PageProps) {
  const res = await api<ItemDetailsResponse>(
    `/api/item-by-slug?slug=${params.slug}`
  );

  if (!res.ok) {
    throw new Error("Failed to load item");
  }

  const { item } = res;

  return (
    <div className="space-y-4">
      <img
        src={item.cdn}
        alt={item.name}
        className="rounded w-full"
      />

      <h1 className="text-2xl font-semibold">
        {item.name}
      </h1>

      {item.description && (
        <p className="text-gray-600">
          {item.description}
        </p>
      )}
    </div>
  );
}