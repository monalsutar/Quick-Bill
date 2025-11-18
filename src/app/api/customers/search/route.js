import { NextResponse } from "next/server";
import connection from "../../../../../lib/mongo";
import Customer from "../../../../../models/Customer";

export async function GET(req) {
  try {
    await connection();
    const { search } = Object.fromEntries(new URL(req.url).searchParams);

    if (!search || search.length < 1) {
      return NextResponse.json([]);
    }

    // search by name starting characters (case-insensitive)
    const results = await Customer.find({
      name: { $regex: "^" + search, $options: "i" }
    }).limit(8);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error("Search Error:", error);
    return NextResponse.json({ message: "Error searching" }, { status: 500 });
  }
}
