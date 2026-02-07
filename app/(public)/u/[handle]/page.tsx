export default async function PublicProfilePage({
  params,
  searchParams,
}: PageProps) {
  const tab = searchParams.tab === "comments" ? "comments" : "likes";

  const res = await getPublicProfile(
    params.handle,
    tab,
    searchParams.cursor
  );

  if (!res.ok) {
    return (
      <main className="min-h-screen flex items-center justify-center text-gray-400">
        User not found
      </main>
    );
  }

  // ✅ FIX: access `data` from ApiOk wrapper
  const { profilePic, likedCount, commentCount, likes, comments } = res.data;

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
            className="rounded-full border-4 border-black bg-black"
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
          <TabLink active={tab === "likes"} href={`/u/${params.handle}?tab=likes`}>
            Likes
          </TabLink>
          <TabLink active={tab === "comments"} href={`/u/${params.handle}?tab=comments`}>
            Comments
          </TabLink>
        </div>

        {/* ===== Timeline ===== */}
        <section className="mt-6 space-y-6">
          {tab === "likes" &&
            likes.items.map((item: UserLike) => <LikeRow key={item.itemId} item={item} />)}
          {tab === "comments" &&
            comments.items.map((item: UserComment) => (
              <CommentRow key={`${item.itemId}-${item.commentedAt}`} item={item} />
            ))}
        </section>

        {/* ===== Pagination ===== */}
        <div className="py-10">
          {tab === "likes" && likes.hasMore && (
            <LoadMore handle={params.handle} tab="likes" cursor={likes.nextCursor} />
          )}
          {tab === "comments" && comments.hasMore && (
            <LoadMore handle={params.handle} tab="comments" cursor={comments.nextCursor} />
          )}
        </div>
      </section>
    </main>
  );
}