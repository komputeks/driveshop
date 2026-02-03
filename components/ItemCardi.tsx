import Link from "next/link";

export default function ItemCard({ item }) {
  return (
    <Link href={`/item/${item.slug}`}>
      <div className="border rounded overflow-hidden hover:shadow">
        <img
          src={item.cdn}
          alt={item.name}
          className="w-full aspect-square object-cover"
        />

        <div className="p-2 text-sm truncate">
          {item.name}
        </div>
      </div>
    </Link>
  );
}