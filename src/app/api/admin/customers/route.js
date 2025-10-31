//src/app/api/admin/customers/route.js

import connection from "../../../../../lib/mongo";
import Customer from "../../../../../models/Customer";
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

    // 🟢 Simplified query — only get name + email
    const customers = await Customer.find({}, {
      name: 1,
      email: 1,
      billMethod: 1,
      address :1,
      phone:1,
      addedBy: 1,
      createdAt: 1,
      updatedAt: 1
    }).populate('addedBy', 'name email').lean();


    return new Response(JSON.stringify({ customers }), { status: 200 });
  } catch (err) {
    console.error("Error in /api/admin/customers:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
