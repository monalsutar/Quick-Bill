import Stock from "../../../../models/Stock";
import connection from "../../../../lib/mongo";

export async function POST(req) {
  try {
    await connection();
    const { productName, quantitySold, quantityDelta } = await req.json();

    if (!productName) {
      return new Response(JSON.stringify({ message: "Product name required" }), { status: 400 });
    }

    // Find product
    const product = await Stock.findOne({ productName });
    if (!product) {
      return new Response(JSON.stringify({ message: "Product not found" }), { status: 404 });
    }

    // Determine how much to change
    // - If quantityDelta is given, use it (can be +ve or -ve)
    // - Else if quantitySold is given, subtract that
    let change = 0;
    if (quantityDelta !== undefined) {
      change = quantityDelta;
    } else if (quantitySold !== undefined) {
      change = -Math.abs(quantitySold);
    } else {
      return new Response(JSON.stringify({ message: "No quantity provided" }), { status: 400 });
    }

    // Prevent negative stock
    if (product.quantityAvailable + change < 0) {
      return new Response(JSON.stringify({ message: "Insufficient stock" }), { status: 400 });
    }

    // Apply the change
    product.quantityAvailable += change;
    await product.save();

    const action =
      change > 0 ? "restored" : change < 0 ? "reduced" : "no change";

    return new Response(
      JSON.stringify({
        message: `Stock ${action} successfully`,
        updatedQuantity: product.quantityAvailable,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Stock update error:", error);
    return new Response(JSON.stringify({ message: error.message }), { status: 500 });
  }
}
