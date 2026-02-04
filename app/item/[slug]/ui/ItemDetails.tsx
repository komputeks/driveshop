import { api } from "@/lib/api";


type PageProps = {
  params: {
    slug: string;
  };
};

export default async function ItemDetails({ slug }) {
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