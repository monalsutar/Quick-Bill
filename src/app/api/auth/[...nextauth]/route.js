import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import connection from "../../../../../lib/mongo";
import User from "../../../../../models/User";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await connection();
        const user = await User.findOne({ email: credentials.email });
        if (!user) throw new Error("User not found");
        const valid = await bcrypt.compare(credentials.password, user.pass);
        if (!valid) throw new Error("Invalid password");
        return { id: user._id.toString(), email: user.email, role: user.role || "worker" };
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role;
      session.jwt = token; // expose the token
      return session;
    },
  },

};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
