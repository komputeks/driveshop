import ItemDetails from "./ui/ItemDetails";
import ItemActions from "./ui/ItemActions";
import ItemComments from "./ui/ItemComments";

type PageProps = {
  params: {
    slug: string;
  };
};

export default async function ItemPage({ params }: PageProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <ItemDetails slug={params.slug} />
      <ItemActions slug={params.slug} />
      <ItemComments slug={params.slug} />
    </div>
  );
}