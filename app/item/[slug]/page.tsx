import ItemDetails from "./ui/ItemDetails";
import ItemActions from "./ui/ItemActions";
import ItemComments from "./ui/ItemComments";

export default async function ItemPage({ params }) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <ItemDetails slug={params.slug} />
      <ItemActions slug={params.slug} />
      <ItemComments slug={params.slug} />
    </div>
  );
}