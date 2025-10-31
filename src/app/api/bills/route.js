import dbConnect from "../../../../lib/dbConnect";
import Bill from "../../../../models/Bill";

export async function POST(req) {
  try {
    await dbConnect();
    const data = await req.json();

    // optional: check duplicate via local_id
    if (data.local_id) {
      const existing = await Bill.findOne({ local_id: data.local_id });
      if (existing) {
        return new Response(JSON.stringify({ success: true, message: "Already synced" }), {
          status: 200,
        });
      }
    }

    const newBill = await Bill.create(data);
    return new Response(JSON.stringify({ success: true, bill: newBill }), { status: 201 });
  } catch (error) {
    console.error("Error saving bill:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return new Response(JSON.stringify({ success: false, message: "Missing bill ID" }), { status: 400 });
    }

    const bill = await Bill.findById(id);
    if (!bill) {
      return new Response(JSON.stringify({ success: false, message: "Bill not found" }), { status: 404 });
    }

    return new Response(JSON.stringify({ success: true, bill }), { status: 200 });
  } catch (error) {
    console.error("Error fetching bill:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}

