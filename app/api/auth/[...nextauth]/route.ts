import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { callGas } from "@/lib/core";

export const auth = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    })
  ],
  secret: process.env.NEXTAUTH_SECRET!,
  callbacks: {
    async session({ session }) {
      // Detect admin
      const email = session.user?.email;
      session.user.role = process.env.ADMIN_EMAILS?.split(",").includes(email!) ? "admin" : "user";

      // Send to GAS Users sheet
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
});

export { auth as GET, auth as POST };