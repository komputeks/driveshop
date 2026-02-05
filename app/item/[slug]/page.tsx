import ItemDetails from "./ui/ItemDetails";
import ItemActions from "./ui/ItemActions";
import ItemComments from "./ui/ItemComments";
import type { ItemPageProps } from "@/lib/types";

export default function ItemPage({ params }: ItemPageProps) {
  const { slug } = params;

  return (
    <main className="max-w-4xl mx-auto space-y-8 px-4 py-10">
      {/* Item info */}
      <ItemDetails slug={slug} />

      {/* Actions (likes, etc.) */}
      <ItemActions slug={slug} />

      {/* Comments */}
      <ItemComments slug={slug} />
    </main>
  );
}