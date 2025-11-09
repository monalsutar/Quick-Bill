import connection from "../../../../../lib/mongo";
import User from "../../../../../models/User"; // update path/model name if different
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectDB();
    const { email, newPassword } = await req.json();

    if (!email || !newPassword)
      return NextResponse.json({ success: false, message: "Missing data" }, { status: 400 });

    const hashed = await bcrypt.hash(newPassword, 10);
    const user = await User.findOneAndUpdate({ email }, { pass: hashed }, { new: true });

    if (!user)
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Error updating password" }, { status: 500 });
  }
}
