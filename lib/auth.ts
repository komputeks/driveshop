import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";
import { callGas } from "@/lib/core";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
  async jwt({ token, user }) {

    // First login
    if (user?.email) {
      try {
        const res = await callGas("/?path=userGet", {
          email: user.email,
        });

        token.phone = res.phone || null;
        token.role = res.role || "user";
      } catch {
        token.role = "user";
      }
    }

    return token;
  },

  async session({ session, token }) {
    if (session.user) {
      session.user.phone = token.phone as string | undefined;
      session.user.role = token.role as "admin" | "user";
    }

    return session;
  },
},
};