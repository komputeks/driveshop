// app/page.tsx (Server Component)
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { LogoutButton } from "@/components/LogoutButton";

export default async function Profile() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return <p>Not signed in</p>;
  }

  const { user } = session;

  return (
    <div>
      <h1>Welcome, {user.name ?? "Anonymous"}</h1>

      {user.image && (
        <img
          src={user.image}
          alt={user.name ?? "User avatar"}
          width={80}
          height={80}
        />
      )}

      <p>Email: {user.email}</p>
      <LogoutButton />
    </div>
  );
}