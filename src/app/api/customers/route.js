import { NextResponse } from "next/server";
import connection from "../../../../lib/mongo";
// import User from "../../../../models/User";
import Customer from "../../../../models/Customer";

export async function POST(req) {
  try {
    await connection();
    const body = await req.json();
    const { name, email, phone, address } = body;

    // check if customer already exists
    const existing = await Customer.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      return NextResponse.json(
        { message: "Customer already exists" },
        { status: 400 }
      );
    }

    const newCustomer = new Customer({ name, email, phone, address });
    await newCustomer.save();

    return NextResponse.json(
      { message: "Customer added successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Error saving customer" }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connection();
    const customers = await Customer.find();
    return NextResponse.json(customers);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching customers" }, { status: 500 });
  }
}
