import ItemDetails from "./ui/ItemDetails";
import ItemActions from "./ui/ItemActions";
import ItemComments from "./ui/ItemComments";
import type { SlugProps } from "@/lib/types";

export default async function ItemPage({ slug }: SlugProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <ItemDetails slug={slug} />
      <ItemActions slug={slug} />
      <ItemComments slug={slug} />
    </div>
  );
}