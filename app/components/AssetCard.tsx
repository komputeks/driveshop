"use client";

import { useEvent } from "@/lib/useEvent";

export default function ItemCard({ item }: any) {
  const { send } = useEvent();

  return (
    <div className="rounded-xl overflow-hidden shadow bg-white dark:bg-gray-900">

      <img
        src={item.cdnUrl}
        alt={item.name}
        loading="lazy"
        className="w-full h-48 object-cover"
      />

      <div className="p-4">

        <h3 className="font-semibold truncate">
          {item.name}
        </h3>

        <div className="flex justify-between mt-3">

          <button onClick={() => send(item.id, "like")}>
            ❤️ {item.likes}
          </button>

          <button onClick={() => send(item.id, "view")}>
            👁 {item.views}
          </button>

        </div>
      </div>
    </div>
  );
}