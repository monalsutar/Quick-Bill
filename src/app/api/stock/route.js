import Stock from "../../../../models/Stock";
import connection from "../../../../lib/mongo";

export async function GET(req) {
  try {
    await connection();
    const stockItems = await Stock.find();
    return new Response(JSON.stringify(stockItems), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connection();
    const data = await req.json();
    const newItem = await Stock.create(data);
    return new Response(JSON.stringify(newItem), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await connection();
    const { id, ...updateData } = await req.json();
    const updatedItem = await Stock.findByIdAndUpdate(id, updateData, { new: true });
    return new Response(JSON.stringify(updatedItem), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await connection();
    const { id } = await req.json();
    await Stock.findByIdAndDelete(id);
    return new Response(JSON.stringify({ message: "Deleted successfully" }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), { status: 500 });
  }
}
