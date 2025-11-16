import { NextResponse } from "next/server";
import connection from "../../../../lib/mongo";
import Customer from "../../../../models/Customer";

export async function POST(req) {
  try {
    await connection();
    const { name, email, phone, address, forceUpdate } = await req.json();

    // 1️⃣ Check phone number exists already
    const existingPhone = await Customer.findOne({ phone });

    if (existingPhone) {
      // Case A: Name is same → return existing
      if (existingPhone.name === name) {
        return NextResponse.json(
          {
            message: `🎉 Welcome back ${existingPhone.name}!`,
            customerId: existingPhone._id,
          },
          { status: 200 }
        );
      }

      // Case B: Name is different → ask frontend what to do
      if (!forceUpdate) {
        return NextResponse.json(
          {
            message: `⚠️ Phone number already exists`,
            existingName: existingPhone.name,
            newName: name,
            askChoice: true,
            customerId: existingPhone._id,
          },
          { status: 409 }
        );
      }

      // Case C: User selected "Update name"
      existingPhone.name = name;
      existingPhone.address = address;
      existingPhone.email = email;
      await existingPhone.save();

      return NextResponse.json(
        {
          message: `📝 Name updated successfully!`,
          customerId: existingPhone._id,
        },
        { status: 200 }
      );
    }

    // 2️⃣ No duplicate → create new customer
    const newCustomer = new Customer({ name, email, phone, address });
    await newCustomer.save();

    return NextResponse.json(
      {
        message: `✅ New customer "${newCustomer.name}" added successfully!`,
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
