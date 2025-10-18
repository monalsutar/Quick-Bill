//src/app/api/admin/users/route.js

import connection from "../../../../../lib/mongo";
import User from "../../../../../models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    // 🔓 TEMPORARY: Allow anyone (for testing display)
    // const session = await getServerSession(authOptions);
    // if (!session || session.user.role !== "admin") {
    //   return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    // }


    await connection();

    // 🟢 Simplified query — just get name + email + role
    const users = await User.find({}, { email: 1, role: 1, lastLogin: 1, createdAt: 1, updatedAt: 1 }).lean();


    return new Response(JSON.stringify({ users }), { status: 200 });
  } catch (err) {
    console.error("Error in /api/admin/users:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
