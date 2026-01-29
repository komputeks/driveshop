import NextAuth, { DefaultSession } from "next-auth";

/* ---------------- Extend Session ---------------- */

declare module "next-auth" {
  interface Session {
    user: {
      id: string | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      phone?: string | null;
      role?: "admin" | "user";
    } & DefaultSession["user"];
  }

  interface User {
    phone?: string;
    role?: "admin" | "user";
  }
}

/* ---------------- Extend JWT ---------------- */

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    phone?: string;
    role?: "admin" | "user";
  }
}

