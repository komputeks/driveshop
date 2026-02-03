"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function Pagination({ page, hasMore }) {
  const router = useRouter();
  const params = useSearchParams();

  const go = (p: number) => {
    const q = new URLSearchParams(params.toString());
    q.set("page", String(p));
    router.push(`/items?${q.toString()}`);
  };

  return (
    <div className="flex gap-2 justify-center">
      {page > 1 && (
        <button onClick={() => go(page - 1)}>Prev</button>
      )}
      {hasMore && (
        <button onClick={() => go(page + 1)}>Next</button>
      )}
    </div>
  );
}