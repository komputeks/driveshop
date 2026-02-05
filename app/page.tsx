// client component
import { useSession, signOut } from "next-auth/react";

export default function UserProfile() {
  const { data: session } = useSession();

  if (!session) return <p>Not logged in</p>;

  return (
    <div>
      <h2>{session.user.name}</h2>
      <img src={session.user.image!} alt={session.user.name!} />
      <button onClick={() => signOut()}>Logout</button>
    </div>
  );
}