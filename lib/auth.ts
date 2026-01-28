import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions } from "next-auth";
import { callGas } from "@/lib/core";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    })
  ],
  secret: process.env.NEXTAUTH_SECRET!,
  callbacks: {
    async session({ session }) {
      const email = session.user?.email;
      session.user.role = process.env.ADMIN_EMAILS?.split(",").includes(email!) ? "admin" : "user";

      // Sync to GAS Users sheet
      if (email) {
        try {
          await callGas("/v1/admin/users", {
            action: "upsert",
            payload: { email, name: session.user?.name }
          });
        } catch (e) {
          console.error("GAS user sync failed", e);
        }
      }

      return session;
    }
  },
  pages: {
    signIn: "/login"
  }
};