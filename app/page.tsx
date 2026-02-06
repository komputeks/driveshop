import Link from "next/link";

export default function HomePage() {

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 via-black to-zinc-900">
      <div className="w-full max-w-md rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 text-center space-y-6">

        <h1 className="text-3xl font-bold text-white">
          DriveShop
        </h1>
          <Link
            href="/profile"
            className="block w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90"
          >
            Go to your profile
          </Link>
      </div>
    </main>
  );
}