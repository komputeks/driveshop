import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
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
    async signIn({ user }) {
      try {
        await fetch(process.env.NEXT_PUBLIC_API_BASE_URL!, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            path: "user",
            email: user.email,
            name: user.name,
            photo: user.image,
          }),
        });
      } catch (e) {
        console.error("GAS sync failed", e);
      }

      return true;
    },
  },
});

export { handler as GET, handler as POST };