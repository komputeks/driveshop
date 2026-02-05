// app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";

interface UserProfile {
  email: string;
  name: string;
  photo?: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        // Attempt to fetch logged-in user profile
        const res = await fetch("/api/user-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "user.profile" }),
        });

        const data = await res.json();
        if (data.ok) {
          setUser(data.user || null);
        } else {
          setUser(null); // fallback
        }
      } catch (err) {
        console.error(err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  if (loading) return <p>Loading profile…</p>;

  if (!user) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="mt-4 text-gray-500">
          You are not logged in. Please <a href="/login" className="text-blue-500 underline">login</a> to view your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">{user.name || "Profile"}</h1>
      {user.photo && <img src={user.photo} alt={user.name} className="w-32 h-32 rounded-full mt-4" />}
      <p className="mt-2 text-gray-500">{user.email}</p>
      {/* Add stats, comments, etc. here if desired */}
    </div>
  );
}