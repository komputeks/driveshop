import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";

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
    async session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = token.email as string;
      }

      return session;
    },

    async jwt({ token, account, profile }) {
      if (profile?.email) {
        token.email = profile.email;
      }

      return token;
    },
  },

  pages: {
    signIn: "/login",
  },
};