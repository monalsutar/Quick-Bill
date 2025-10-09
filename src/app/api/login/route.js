import { NextResponse } from "next/server";

import connection from "../../../../lib/mongo";
import User from "../../../../models/User";


export async function POST(req) {
  try {
    await connection();
    const { email, pass } = await req.json();

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (user.password !== pass) {
      return NextResponse.json({ message: "Incorrect password" }, { status: 401 });
    }

    return NextResponse.json({ message: "Login successful" }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Error occurred" }, { status: 500 });
  }
}
