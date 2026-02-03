import ItemsInfinite from "./ItemsInfinite";
import { api } from "@/lib/api";

export default async function ItemsPage({ searchParams }) {
  const params = new URLSearchParams(searchParams).toString();

  const initial = await api(
    `/api/items.list?page=1&limit=20&${params}`
  );

  return (
    <ItemsInfinite
      initialData={initial}
      searchParams={searchParams}
    />
  );
}