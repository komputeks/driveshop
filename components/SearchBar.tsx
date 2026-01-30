"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBar() {

  const [q, setQ] = useState("");
  const router = useRouter();

  function submit(e: any) {
    e.preventDefault();

    if (!q.trim()) return;

    router.push(`/?q=${encodeURIComponent(q)}`);
  }

  return (
    <form
      onSubmit={submit}
      className="flex w-full max-w-md"
    >
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Search images..."
        className="w-full border rounded-l px-3 py-2"
      />

      <button
        className="bg-black text-white px-4 rounded-r"
      >
        Search
      </button>
    </form>
  );
}