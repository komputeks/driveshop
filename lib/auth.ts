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
    /* ---------------- JWT ---------------- */
    async jwt({ token, user }) {
      // First login
      if (user?.email) {
        try {
          // Ask GAS who this user is
          const res = await callGas("/user/get", {
            email: user.email,
          });

          token.role = res?.role || "user";
          token.phone = res?.phone || null;
          token.uid = res?.id || null;
        } catch {
          token.role = "user";
        }
      }

      return token;
    },

    /* ---------------- SESSION ---------------- */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string; // ✅ use token.sub
        session.user.role = token.role as "admin" | "user";
        session.user.phone = token.phone as string | null;
      }
      return session;
    },
  },
};