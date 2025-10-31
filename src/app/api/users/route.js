import connection from "../../../../lib/mongo";
import User from "../../../../models/User";
import { NextResponse } from "next/server";


export async function POST(req) {
  const { name, phone, email, pass } = await req.json();
  await connection();

  const exists = await User.findOne({ email });
  if (exists) {
    return new Response(JSON.stringify({ message: "User already exists" }), { status: 400 });
  }

  const bcrypt = (await import("bcryptjs")).default;
  const hashed = await bcrypt.hash(pass, 10);
  await User.create({ name, phone, email, pass: hashed, role: "worker" });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}


