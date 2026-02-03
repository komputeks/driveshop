import { Suspense } from "react";
import ItemsList from "./ui/ItemsList";
import Filters from "./ui/Filters";

export default function ItemsPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <aside className="md:col-span-1">
        <Filters />
      </aside>

      <main className="md:col-span-3">
        <Suspense fallback={<div>Loading items…</div>}>
          <ItemsList />
        </Suspense>
      </main>
    </div>
  );
}