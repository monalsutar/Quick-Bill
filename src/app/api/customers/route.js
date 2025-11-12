import { NextResponse } from "next/server";
import connection from "../../../../lib/mongo";
import Customer from "../../../../models/Customer";

export async function POST(req) {
  try {
    await connection();
    const { name, email, phone, address } = await req.json();

    const existing = await Customer.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      // ✅ Return existing customerId so frontend can proceed
      return NextResponse.json(
        {
          message: `🎉 Welcome back! We found your customer record for "${existing.name}".`,
          customerId: existing._id,
        },
        { status: 200 } // Change to 200 so it’s treated as success
      );
    }

    // Create new customer if not found
    const newCustomer = new Customer({ name, email, phone, address });
    await newCustomer.save();

    return NextResponse.json(
      {
        message: `✅ New customer "${newCustomer.name}" added successfully! Let’s continue to product details.`,
        customerId: newCustomer._id,
      },
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
