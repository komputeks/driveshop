// server component
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function Profile() {
  const session = await getServerSession(authOptions);

  if (!session) return <p>Not signed in</p>;

  return (
    <div>
      <h1>Welcome, {session.user.name}</h1>
      <img src={session.user.image} alt={session.user.name} width={80} />
      <p>Email: {session.user.email}</p>
    </div>
  );
}