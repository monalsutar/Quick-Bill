import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { to, subject, billData } = await req.json();

  if (!Array.isArray(billData) || billData.length === 0) {
    return NextResponse.json(
      { success: false, message: "billData is missing or empty" },
      { status: 400 }
    );
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Build simple bill message
    let billMessage = "🧾 Your Bill Details:\n\n";
    billData.forEach((item, i) => {
      billMessage += `${i + 1}. ${item.category} - ${item.product} | Price: ₹${item.price} | Qty: ${item.quantity} | Total: ₹${item.total}\n`;
    });

    const totalAmount = billData
      .reduce((sum, item) => sum + parseFloat(item.total), 0)
      .toFixed(2);

    billMessage += `\nFinal Bill: ₹${totalAmount}\n\nThank you for your purchase! 😊`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text: billMessage, // plain text email
    });

    return NextResponse.json({ success: true, message: "Mail sent successfully!" });
  } catch (error) {
    console.error("Email Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
