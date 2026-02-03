import Link from "next/link";

export default function ItemCard({ item, stats }) {
  return (
    <Link
      href={`/item/${item.slug}`}
      className="block border rounded p-3 hover:shadow"
    >
      <img
        src={item.cdn}
        alt={item.name}
        className="w-full h-40 object-cover rounded"
      />

      <h3 className="mt-2 font-semibold">{item.name}</h3>

      <div className="text-xs text-gray-500 flex gap-3 mt-1">
        <span>❤️ {stats?.like ?? 0}</span>
        <span>💬 {stats?.comment ?? 0}</span>
        <span>👀 {stats?.view ?? 0}</span>
      </div>
    </Link>
  );
}