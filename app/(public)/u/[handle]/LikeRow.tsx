import Image from "next/image";
import Link from "next/link";
import type { UserLike } from "@/lib/publicProfileTypes";

export default function LikeRow({ item }: { item: UserLike }) {
  return (
    <Link
      href={item.pageUrl}
      className="flex gap-4 items-center bg-white/5 hover:bg-white/10 transition rounded-xl p-4"
    >
      {/* Item image */}
      <Image
        src={item.itemImage || "/placeholder.png"}
        alt={item.itemName}
        width={64}
        height={64}
        className="rounded-lg object-cover"
      />

      {/* Item title + timestamp */}
      <div className="flex flex-col">
        <p className="font-medium text-white hover:underline">
          {item.itemName}
        </p>
        <p className="text-xs text-gray-400">
          Liked {new Date(item.likedAt).toLocaleString()}
        </p>
      </div>
    </Link>
  );
}