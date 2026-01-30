import AssetCard from "@/components/AssetCard";
import { fetchItems } from "@/lib/posts";

export default async function CategoryPage({
  params,
}: any) {

  const data = await fetchItems({
    category: params.cat,
  });

  return (
    <main className="pt-20 max-w-7xl mx-auto p-6">

      <h1 className="text-2xl font-bold mb-6 capitalize">
        {params.cat}
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

        {data.items.map((item: any) => (
          <AssetCard key={item.id} item={item} />
        ))}

      </div>

    </main>
  );
}