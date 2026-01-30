import AssetCard from "@/components/AssetCard";
import { fetchItems } from "@/lib/posts";

export default async function Home({
  searchParams,
}: {
  searchParams?: {
    q?: string;
    cat?: string;
  };
}) {

  const data = await fetchItems({
    q: searchParams?.q,
    category: searchParams?.cat,
  });

  return (
    <main className="pt-20 max-w-7xl mx-auto p-6">

      <h1 className="text-3xl font-bold mb-6">
        Gallery
      </h1>

      {data.items.length === 0 && (
        <p className="text-gray-500">
          No items found
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

        {data.items.map((item: any) => (
          <AssetCard key={item.id} item={item} />
        ))}

      </div>
    </main>
  );
}