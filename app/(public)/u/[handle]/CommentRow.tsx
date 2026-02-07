import type { UserComment } from "@/lib/publicProfileTypes";
import Image from "next/image";

export default function CommentRow({ item }: { item: UserComment }) {
  return (
    <div className="flex gap-4 bg-white/5 rounded-xl p-4 items-start">
      {/* User avatar */}
      <Image
        src={item.userImage || "/avatar.png"}
        alt="User avatar"
        width={48}
        height={48}
        className="rounded-full object-cover"
      />

      {/* Comment content */}
      <div className="flex-1">
        <Link
          href={item.pageUrl}
          className="font-medium hover:underline"
        >
          {item.itemName}
        </Link>

        <p className="mt-2 text-sm text-gray-300">{item.comment}</p>

        <p className="text-xs text-gray-400 mt-1">
          {new Date(item.commentedAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}