import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist Google profile info on first login
      if (account && profile) {
        token.email = profile.email;
        token.name = profile.name;
        token.picture = profile.picture;

        // Upsert user in GAS
        try {
          const res = await fetch(process.env.NEXT_PUBLIC_API_BASE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "login",
              email: profile.email,
              name: profile.name,
              photo: profile.picture
            })
          });
          const data = await res.json();
          if (!data.ok) console.error("GAS login failed:", data.error);
        } catch (err) {
          console.error("GAS login error:", err);
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Make JWT data available in session
      session.user.email = token.email;
      session.user.name = token.name;
      session.user.image = token.picture;
      return session;
    }
  },
  pages: {
    signIn: "/auth/signin",
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };