import { NextResponse } from "next/server";
import connection from "../../../../lib/mongo";
import Customer from "../../../../models/Customer";

export async function POST(req) {
  try {
    await connection();
    const { name, email, phone, address } = await req.json();

    const existing = await Customer.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      return NextResponse.json(
        { message: "Customer already exists", customerId: existing._id },
        { status: 400 }
      );
    }

    const newCustomer = new Customer({ name, email, phone, address });
    await newCustomer.save();

    return NextResponse.json(
      { message: "Customer added successfully", customerId: newCustomer._id },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
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
