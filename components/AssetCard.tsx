"use client";

import { useEvent } from "@/lib/useEvent";
import { useEffect, useRef, useState } from "react";

export default function AssetCard({ item }: any) {
  const { send } = useEvent();
  const ref = useRef<HTMLDivElement>(null);
  const viewed = useRef(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !viewed.current) {
        viewed.current = true;
        send(item.id, "view");
        obs.disconnect();
      }
    });

    obs.observe(ref.current);

    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="rounded-xl shadow bg-white overflow-hidden"
    >
      <img
        src={item.cdnUrl}
        className="h-48 w-full object-cover"
      />

      <div className="p-3">
        <h3 className="font-medium truncate">{item.name}</h3>

        <div className="flex justify-between mt-2 text-sm">
          <button
            disabled={liked}
            onClick={() => {
              send(item.id, "like");
              setLiked(true);
            }}
          >
            ❤️ {item.likes}
          </button>

          <span>👁 {item.views}</span>
        </div>
      </div>
    </div>
  );
}