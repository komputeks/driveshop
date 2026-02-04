import Image from "next/image";

async function getUserProfile(email: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}?action=userProfile&email=${encodeURIComponent(email)}`,
    { next: { tags: [`user:${email}`] } }
  );

  if (!res.ok) return null;
  return res.json();
}

export default async function ProfilePage({
  params,
}: {
  params: { email: string };
}) {
  const profile = await getUserProfile(params.email);

  if (!profile?.ok) {
    return (
      <div className="p-8 text-center text-gray-400">
        User not found
      </div>
    );
  }

  const { user, stats, comments } = profile;

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      {/* Header */}
      <section className="flex gap-6 items-center">
        <Image
          src={user.photo}
          alt={user.name}
          width={96}
          height={96}
          className="rounded-full"
        />
        <div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-sm text-gray-400">{user.email}</p>
          <p className="text-xs text-gray-500">
            Joined {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="flex gap-8 mt-8 text-sm">
        <div>👍 {stats.likes} likes</div>
        <div>💬 {stats.comments} comments</div>
        <div>👁 {stats.views} views</div>
      </section>

      {/* Comments */}
      <section className="mt-10">
        <h2 className="font-semibold mb-4">Recent comments</h2>
        <ul className="space-y-4">
          {comments.map((c: any) => (
            <li
              key={c.id}
              className="bg-white/5 p-4 rounded-xl text-sm"
            >
              <p className="mb-1">{c.value}</p>
              <span className="text-xs text-gray-400">
                {new Date(c.createdAt).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}