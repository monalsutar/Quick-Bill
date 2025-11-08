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
    async signIn({ user, account }) {
      await connection();

      // If signing in with Google
      if (account.provider === "google") {
        const existingUser = await User.findOne({ email: user.email });
        if (!existingUser) {
          await User.create({
            name: user.name,
            email: user.email,
            image: user.image || "",
            googleId: account.providerAccountId,
            role: "worker", // default role for google users
          });
        } else {
          // update last login + image if changed
          existingUser.lastLogin = new Date();
          existingUser.image = user.image || "/admin-logo.png";
          await existingUser.save();
        }
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.role = user.role || "worker";
      token.image = user.image || "/admin-logo.png";
      token.name = user.name;
      token.email = user.email;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.role = token.role;
      session.user.image = token.image; // ✅ include image here
      session.jwt = token;
      return session;
    },
  },


};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
