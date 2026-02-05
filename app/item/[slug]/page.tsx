import ItemDetails from "./ui/ItemDetails";
import ItemActions from "./ui/ItemActions";
import ItemComments from "./ui/ItemComments";
import type { PageProps, SlugParam } from "@/lib/types";

export default function ItemPage({ params }: PageProps<SlugParam>) {
  const { slug } = params;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <ItemDetails slug={slug} />
      <ItemActions slug={slug} />
      <ItemComments slug={slug} />
    </div>
  );
}