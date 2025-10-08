import connection from "../../../../lib/mongo";
import User from "../../../../models/User";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    await connection();

    // match field names with frontend
    const { email, pass } = await request.json();

    const newUser = new User({ email, password: pass });
    await newUser.save();

    console.log("User Entered");
    return NextResponse.json(newUser, { status: 201 });

    
  } catch (e) {
    
    
    console.error("User not entered... Failed -----------------", e);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
