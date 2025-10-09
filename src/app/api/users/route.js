import connection from "../../../../lib/mongo";
import User from "../../../../models/User";
import { NextResponse } from "next/server";


export async function POST(req) {
  try {
    await connection();
    const { email, pass } = await req.json();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 });
    }

    const newUser = new User({ email, password: pass });
    await newUser.save();

    return NextResponse.json({ message: "User registered successfully" }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Error occurred" }, { status: 500 });
  }
}

