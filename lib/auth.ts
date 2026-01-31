// lib/auth.ts
// Central NextAuth configuration

import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      // Attach user info to token
      if (user) {
        token.id = user.id;
      }

      return token;
    },

    async session({ session, token }) {
      // Attach token info to session
      if (session.user) {
        (session.user as any).id = token.id;
      }

      return session;
    },
  },

  pages: {
    signIn: "/", // We use modal login, not separate page
  },
};