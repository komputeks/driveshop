import Image from "next/image";
import Link from "next/link";
import type {
  UserProfileResponse,
  UserLike,
  UserComment,
} from "@/lib/publicProfileTypes";

type PageProps = {
  params: { handle: string };
  searchParams: {
    tab?: "likes" | "comments";
    cursor?: string;
  };
};

async function getPublicProfile(
  handle: string,
  tab: "likes" | "comments",
  cursor?: string
): Promise<UserProfileResponse> {
  const res = await fetch(
    `https://driveshp-three.vercel.app/api/public-profile`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        handle,
        limit: 10,
        ...(tab === "likes"
          ? { likesCursor: cursor }
          : { commentsCursor: cursor }),
      }),
      cache: "no-store",
    }
  );

  return res.json();
}

export default async function PublicProfilePage({
  params,
  searchParams,
}: PageProps) {
  const tab = searchParams.tab === "comments" ? "comments" : "likes";

  const data = await getPublicProfile(
    params.handle,
    tab,
    searchParams.cursor
  );

  if (!data.ok) {
    return (
      <main className="min-h-screen flex items-center justify-center text-gray-400">
        User not found
      </main>
    );
  }

  const {
    data: { profilePic, likedCount, commentCount, likes, comments },
  } = data;

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* ===== Header ===== */}
      <section className="relative h-48 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
        <div className="absolute inset-0 bg-black/30" />
      </section>

      {/* ===== Profile card ===== */}
      <section className="max-w-5xl mx-auto px-6 -mt-20">
        <div className="flex items-end gap-6">
          <Image
            src={profilePic || "/avatar.png"}
            alt={params.handle}
            width={128}
            height={128}
            className="rounded-full border-4 border-black bg-black shadow-lg"
          />

          <div>
            <h1 className="text-2xl font-bold">@{params.handle}</h1>

            <div className="flex gap-6 text-sm text-gray-300 mt-2">
              <span>👍 {likedCount} likes</span>
              <span>💬 {commentCount} comments</span>
            </div>
          </div>
        </div>

        {/* ===== Tabs ===== */}
        <div className="flex gap-8 mt-10 border-b border-white/10">
          <TabLink
            active={tab === "likes"}
            href={`/u/${params.handle}?tab=likes`}
          >
            Likes
          </TabLink>

          <TabLink
            active={tab === "comments"}
            href={`/u/${params.handle}?tab=comments`}
          >
            Comments
          </TabLink>
        </div>

        {/* ===== Timeline ===== */}
        <section className="mt-6 space-y-6">
          {tab === "likes" &&
            likes.items.map((item: UserLike) => (
              <LikeRow key={item.itemId} item={item} />
            ))}
          {tab === "comments" &&
            comments.items.map((item: UserComment) => (
              <CommentRow
                key={`${item.itemId}-${item.commentedAt}`}
                item={item}
              />
            ))}
        </section>

        {/* ===== Pagination ===== */}
        <div className="py-10">
          {tab === "likes" && likes.hasMore && (
            <LoadMore
              handle={params.handle}
              tab="likes"
              cursor={likes.nextCursor}
            />
          )}

          {tab === "comments" && comments.hasMore && (
            <LoadMore
              handle={params.handle}
              tab="comments"
              cursor={comments.nextCursor}
            />
          )}
        </div>
      </section>
    </main>
  );
}

/* =======================
   Components
======================= */

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`pb-3 font-medium transition relative ${
        active
          ? "text-white after:absolute after:bottom-0 after:left-0 after:h-1 after:w-full after:rounded-full after:bg-gradient-to-r after:from-purple-400 after:via-pink-500 after:to-orange-400"
          : "text-gray-400 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}

function LikeRow({ item }: { item: UserLike }) {
  return (
    <Link
      href={item.pageUrl}
      className="flex gap-4 items-center bg-white/5 hover:bg-white/10 transition rounded-xl p-4 shadow-sm hover:shadow-md"
    >
      <Image
        src={item.itemImage || "/placeholder.png"}
        alt={item.itemName}
        width={64}
        height={64}
        className="rounded-lg object-cover"
      />

      <div>
        <p className="font-medium">{item.itemName}</p>
        <p className="text-xs text-gray-400">
          Liked {new Date(item.likedAt).toLocaleString()}
        </p>
      </div>
    </Link>
  );
}

function CommentRow({ item }: { item: UserComment }) {
  return (
    <div className="flex gap-4 bg-white/5 rounded-xl p-4 shadow-sm hover:shadow-md transition">
      <Image
        src={item.itemImage || "/placeholder.png"}
        alt={item.itemName}
        width={64}
        height={64}
        className="rounded-lg object-cover"
      />

      <div className="flex-1">
        <Link
          href={item.pageUrl}
          className="font-medium hover:underline"
        >
          {item.itemName}
        </Link>

        <p className="mt-2 text-sm text-gray-300">{item.comment}</p>

        <p className="text-xs text-gray-400 mt-1">
          {new Date(item.commentedAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function LoadMore({
  handle,
  tab,
  cursor,
}: {
  handle: string;
  tab: "likes" | "comments";
  cursor: string | null;
}) {
  if (!cursor) return null;

  return (
    <Link
      href={`/u/${handle}?tab=${tab}&cursor=${encodeURIComponent(
        cursor
      )}`}
      className="block text-center text-sm text-blue-400 hover:underline transition"
    >
      Load more
    </Link>
  );
}