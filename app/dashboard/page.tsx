import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Dashboard() {

  const session = await getServerSession(authOptions);

  if (!session) {
    return <p className="p-10">Not logged in</p>;
  }

  const url = new URL(process.env.NEXT_PUBLIC_GAS_URL!);

  url.searchParams.set("path", "user/dashboard");
  url.searchParams.set("email", session.user!.email!);

  const res = await fetch(url.toString(), {
    cache: "no-store",
  });

  const data = await res.json();

  return (
    <main className="pt-20 max-w-5xl mx-auto p-6">

      <h1 className="text-2xl font-bold mb-6">
        Dashboard
      </h1>

      {/* Profile */}
      <div className="bg-white p-6 rounded shadow mb-8">

        <div className="flex items-center gap-4">

          <img
            src={session.user?.image || ""}
            className="w-20 h-20 rounded-full"
          />

          <div>
            <h2 className="font-semibold text-lg">
              {data.user.name}
            </h2>

            <p className="text-gray-500">
              {data.user.email}
            </p>

            <p>{data.user.phone}</p>
          </div>

        </div>

      </div>

      {/* Favorites */}
      <section className="mb-8">

        <h2 className="font-semibold mb-3">
          Favorites
        </h2>

        <ul className="space-y-2">

          {data.likes.map((i: any) => (
            <li key={i.id}>
              <a
                href={i.url}
                className="text-blue-600"
              >
                {i.title}
              </a>
            </li>
          ))}

        </ul>

      </section>

      {/* Comments */}
      <section>

        <h2 className="font-semibold mb-3">
          Comments
        </h2>

        <ul className="space-y-3">

          {data.comments.map((c: any, i: number) => (
            <li key={i}>

              <a
                href={c.item.url}
                className="text-blue-600"
              >
                {c.item.title}
              </a>

              <p className="text-sm text-gray-600">
                {c.text}
              </p>

            </li>
          ))}

        </ul>

      </section>

    </main>
  );
}