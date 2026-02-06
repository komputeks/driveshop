import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";
import type { LoginRequest, ApiResponse } from "@/lib/types";
import type { User as NextAuthUser } from "next-auth";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile?.email) {
        token.email = profile.email;
        token.name = profile.name;
        token.picture = profile.picture;

        const loginPayload: LoginRequest = {
          action: "login",
          email: profile.email,
          name: profile.name,
          photo: profile.picture,
        };

        try {
          const res = await fetch(
            process.env.NEXT_PUBLIC_API_BASE_URL!,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(loginPayload),
            }
          );

          const data: ApiResponse = await res.json();

          if (!data.ok) {
            console.error("GAS login failed:", data);
          }
        } catch (err) {
          console.error("GAS login error:", err);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email!;
        session.user.name = token.name;
        session.user.image = token.picture;
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
};