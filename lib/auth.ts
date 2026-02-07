import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { LoginRequest, ApiResponse } from "@/lib/types";

const GAS_ENDPOINT = process.env.NEXT_PUBLIC_API_BASE_URL;

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
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async jwt({ token, user, account }) {
      // Runs only on sign-in
      if (account && user) {
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;

        if (!GAS_ENDPOINT) {
          console.error("Missing NEXT_PUBLIC_API_BASE_URL");
          return token;
        }

        const loginPayload: LoginRequest = {
          action: "login",
          email: user.email!,
          name: user.name || "",
          photo: user.image || "",
        };

        try {
          const res = await fetch(GAS_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(loginPayload),
          });

          const data: ApiResponse<unknown> = await res.json();

          if (!data.ok) {
            console.error("GAS login failed:", data.error);
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
        session.user.name = token.name || null;
        session.user.image = token.picture || null;
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
};