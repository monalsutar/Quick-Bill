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
      console.log("Step 2: Google Auth callback triggered");
      await connection();

      if (account.provider === "google") {
        console.log("Step 3: Checking user in MongoDB...");

        let existingUser = await User.findOne({ email: user.email });

        if (!existingUser) {
           console.log("New Google user → Creating in DB");
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
          console.log("Existing Google user → Updating last login");
        }
      }

      return true;
    },

    // ✅ Add all fields to JWT
    async jwt({ token, user, account }) {
      if (user) {
        console.log("Step 4: Building JWT token for session");
        token.id = user.id || user._id;
        token.name = user.name || "Merchant";
        token.email = user.email;
        token.image = user.image || token.image || "/user.png";
        token.role = user.role || "worker";
        token.provider = account?.provider || user.provider || "credentials";
      }
      return token;
      console.log("Token being returned:", token);
    },

    // ✅ Send complete session info to frontend
    async session({ session, token }) {
      console.log("Step 5: Final session sent to browser:", session);

      session.user = {
        id: token.id,
        name: token.name,
        email: token.email,
        image: token.image,
        role: token.role,
        provider: token.provider,
      };
      console.log("Step 6: Browser received session:", session);
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };