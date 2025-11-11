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

        return { 
          id: user._id.toString(), 
          name: user.name,         // ✅ added
          email: user.email, 
          role: user.role || "worker" 
        };
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    // ✅ Handle database syncing when logging in with Google
    async signIn({ user, account }) {
      await connection();

      if (account.provider === "google") {
        let existingUser = await User.findOne({ email: user.email });

        if (!existingUser) {
          existingUser = await User.create({
            name: user.name,
            email: user.email,
            image: user.image, // ✅ Correct image
            googleId: account.providerAccountId,
            role: "worker",
            lastLogin: new Date(),
          });
        } else {
          existingUser.lastLogin = new Date();
          existingUser.image = user.image || existingUser.image;
          await existingUser.save();
        }
      }

      return true;
    },

    // ✅ Add all fields to JWT
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id || user._id;
        token.name = user.name || "Merchant";
        token.email = user.email;
        token.image = user.image || token.image || "/user.png";
        token.role = user.role || "worker";
        token.provider = account?.provider || user.provider || "credentials";
      }
      return token;
    },

    // ✅ Send complete session info to frontend
    async session({ session, token }) {
      session.user = {
        id: token.id,
        name: token.name,
        email: token.email,
        image: token.image,
        role: token.role,
        provider: token.provider,
      };
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };