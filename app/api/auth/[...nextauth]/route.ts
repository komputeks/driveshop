import NextAuth, { AuthOptions } from "next-auth";
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
    async jwt({
      token,
      account,
      user,
      profile,
      isNewUser,
    }: {
      token: JWT;
      account: any;
      user?: NextAuthUser;
      profile?: any;
      isNewUser?: boolean;
    }): Promise<JWT> {
      if (account && profile && profile.email) {
        token.email = profile.email;
        token.name = profile.name;
        token.picture = profile.picture;

        // Upsert user in GAS
        const loginPayload: LoginRequest = {
          action: "login",
          email: profile.email,
          name: profile.name,
          photo: profile.picture,
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

    async session({ session, token }: { session: any; token: JWT }) {
      session.user.email = token.email!;
      session.user.name = token.name;
      session.user.image = token.picture;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };