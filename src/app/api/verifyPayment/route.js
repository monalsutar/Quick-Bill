import crypto from "crypto";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    // ✅ Razorpay redirect flow sends form-data, not JSON
    const body = await req.text();
    const params = new URLSearchParams(body);

    const razorpay_order_id = params.get("razorpay_order_id");
    const razorpay_payment_id = params.get("razorpay_payment_id");
    const razorpay_signature = params.get("razorpay_signature");

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, message: "Missing Razorpay parameters" },
        { status: 400 }
      );
    }

    // ✅ Generate signature on server side
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      // 🧾 Optional: update your DB to mark this bill as paid
      // await Bill.updateOne({ orderId: razorpay_order_id }, { paid: true });

      return NextResponse.json({ success: true, message: "Payment verified successfully ✅" });
    } else {
      return NextResponse.json({ success: false, message: "Invalid signature ❌" }, { status: 400 });
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 }
    );
  }
}
