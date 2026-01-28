import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      phone?: string | null; // <-- add phone here
      role?: "admin" | "user"; // optional role
    };
  }
}