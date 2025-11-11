import dbConnect from "../../../../../lib/dbConnect";
import Customer from "../../../../../models/Customer";
import { NextResponse } from "next/server";

// DELETE /api/customers/:id
export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;

    const deleted = await Customer.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Customer deleted successfully" });
  } catch (err) {
    console.error("Delete customer error:", err);
    return NextResponse.json({ message: "Error deleting customer" }, { status: 500 });
  }
}
