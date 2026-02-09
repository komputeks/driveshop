// app/category/[...slug]/page.tsx
import type { ItemsListResponse } from "@/lib/types";

interface CategoryPageProps {
  params: {
    slug: string[];
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const [cat1, cat2] = params.slug ?? [];

  if (!cat1) {
    return <div className="container-app section">Invalid category</div>;
  }

  const qs = new URLSearchParams();
  qs.set("cat1", cat1);
  if (cat2) qs.set("cat2", cat2);

  const res = await fetch(
    `${process.env.NEXTAUTH_URL}/api/items?${qs.toString()}`,
    { cache: "no-store" }
  );

  const data = (await res.json()) as ItemsListResponse;

  if (!data.ok) {
    return (
      <div className="container-app section">
        <p className="text-red-600">{data.error}</p>
      </div>
    );
  }

  const { items } = data.data;

  return (
    <div className="container-app section stack-lg">
      <header className="stack-sm">
        <h1 className="capitalize">
          {cat1}
          {cat2 && <span className="text-slate-400"> / {cat2}</span>}
        </h1>
        <small>{items.length} items</small>
      </header>

      {items.length === 0 ? (
        <div className="surface-card text-center">
          No items found in this category
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map(item => (
            <a
              key={item.id}
              href={`/item/${item.id}`}
              className="surface-hover surface-card stack-sm"
            >
              <img
                src={item.cdn}
                alt={item.name}
                className="rounded-md aspect-square object-cover"
              />
              <strong className="line-clamp-2">{item.name}</strong>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}