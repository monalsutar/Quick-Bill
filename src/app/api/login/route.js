import { NextResponse } from "next/server";

import connection from "../../../../lib/mongo";
import User from "../../../../models/User";

import bcrypt from "bcryptjs";


export async function POST(req) {
  try {
    const { email, pass } = await req.json();
    await connection();

    // Find worker user
    const user = await User.findOne({ email });
    if (!user) {
      return new Response(JSON.stringify({ message: "User not found" }), { status: 404 });
    }

    // Check role
    if (user.role !== "worker") {
      return new Response(JSON.stringify({ message: "Not a worker account" }), { status: 401 });
    }

    // Verify password
    const valid = await bcrypt.compare(pass, user.pass);
    if (!valid) {
      return new Response(JSON.stringify({ message: "Incorrect password" }), { status: 401 });
    }

    // Update last login time
    user.lastLogin = new Date();
    await user.save();

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ message: "Server error" }), { status: 500 });
  }
}