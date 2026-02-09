import Link from "next/link";
import CategoryMenu from "@/components/CategoryMenu";

export default function HomePage() {

  return (
    <main className="min-h-screen flex items-center justify-center">
      <section>
        <CategoryMenu />
      </section>
      <section className="section bg-grad-soft">
        <div className="container grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl font-bold leading-tight">
              Discover & Share<br />Great Items
            </h1>
            <p className="mt-4 text-muted text-lg">
              Curated content, modern experience.
            </p>
          </div>
      
          <div className="relative">
      
          </div>
        </div>
      </section>
    </main>
  );
}