import Stock from "../../../../models/Stock";
import connection from "../../../../lib/mongo";

export async function POST(req) {
  try {
    await connection();
    const { productName, quantitySold } = await req.json();

    const product = await Stock.findOne({ productName });
    if (!product) {
      return new Response(JSON.stringify({ message: "Product not found" }), { status: 404 });
    }

    if (product.quantityAvailable < quantitySold) {
      return new Response(JSON.stringify({ message: "Insufficient stock" }), { status: 400 });
    }

    product.quantityAvailable -= quantitySold;
    await product.save();

    return new Response(JSON.stringify({ message: "Stock updated successfully" }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), { status: 500 });
  }
}
