import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";
import type { LoginRequest, ApiResponse } from "@/lib/types";

export const authOptions = {
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
    async jwt({ token, account, profile }): Promise<JWT> {
      if (account && profile) {
        token.email = profile.email as string;
        token.name = profile.name as string;
        token.picture = profile.picture as string;

        // Upsert user in GAS
        const loginPayload: LoginRequest = {
          action: "login",
          email: profile.email as string,
          name: profile.name as string,
          photo: profile.picture as string,
        };

        try {
          const res = await fetch(process.env.NEXT_PUBLIC_API_BASE_URL!, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(loginPayload),
          });

          const data: ApiResponse = await res.json();

          if (!data.ok) console.error("GAS login failed:", (data as any).error);
        } catch (err) {
          console.error("GAS login error:", err);
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.email = token.email!;
      session.user.name = token.name;
      session.user.image = token.picture;
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };