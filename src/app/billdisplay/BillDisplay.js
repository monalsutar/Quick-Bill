"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import generateBillPDF from "../utils/generateBillPDF";
import printBill from "../utils/printBill";
import "./billdisplay.css";

export default function BillDisplay() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [billData, setBillData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const printRef = useRef();

  // State for loader and payment status
  const [isPaying, setIsPaying] = useState(false);
  const [isPaymentDone, setIsPaymentDone] = useState(false);

  useEffect(() => {
    const data = searchParams.get("data");
    if (data) setBillData(JSON.parse(decodeURIComponent(data)));
  }, [searchParams]);

  if (!billData) return <p style={{ textAlign: "center", marginTop: "40px" }}>Loading Bill...</p>;

  const { customer, products, paymentMode, date } = billData;

  // 💰 Calculate totals
  const subtotal = products.reduce((acc, p) => acc + p.price * p.quantity, 0);
  const totalGST = products.reduce((acc, p) => acc + p.taxAmount, 0);
  const cgst = totalGST / 2;
  const sgst = totalGST / 2;
  const grandTotal = subtotal; // Price includes GST (like D-Mart)

  // 💳 Razorpay Payment Handler
  // Existing payment logic reuse
  const handleRazorpayPayment = async () => {
    if (!products.length) return alert("Add products first");
    if (!window.Razorpay) return alert("Razorpay not loaded!");

    const totalAmount = subtotal * 100;
    try {
      const { data: order } = await axios.post("/api/createOrder", { amount: totalAmount, currency: "INR" });

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Quick Bill",
        description: "Purchase Bill",
        order_id: order.id,
        handler: async function (response) {
          try {
            const verifyRes = await axios.post("/api/verifyPayment", response);
            alert(verifyRes.data.success ? "Payment Successful ✅" : "Payment verification failed ❌");

            setIsPaymentDone(true); // ✅ mark done

          } catch {
            alert("Error verifying payment");
          }
        },
        prefill: {
          name: customer?.name,
          email: customer?.email,
        },
        theme: { color: "#3399cc" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error(error);
      alert("Payment failed: " + error.message);
    }
  };



  //mail sending
  const handleSendMail = async () => {
    if (!customer?.email) return alert("Customer email required!");
    if (!products.length) return alert("Add at least one product!");

    setLoading(true);
    const billSummary = products.map((p) => ({
      category: p.category,
      product: p.productName,
      price: p.price,
      quantity: p.quantity,
      total: p.price * p.quantity,
    }));

    try {
      const res = await axios.post("/api/sendMail", {
        to: customer.email,
        subject: "Your Bill from Quick Bill",
        billData: billSummary,
      });
      alert(res.data.success ? "Bill sent successfully ✅" : "Mail failed ❌");
    } catch (err) {
      console.error(err);
      alert("Error sending mail");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePDF = () => generateBillPDF(customer, products, paymentMode, setLoading);
  const handlePrint = () => printBill(customer, products, null, printRef);

  return (
    <div className="billdisplay-wrapper">
      <div className="billdisplay-container">
        {/* Left Side: Bill Section */}
        <div className="bill-section" ref={printRef}>
          <div className="bill-header">
            <h1>Quick Bill Billing Application</h1><br></br>

            <p><b>Date:</b> {date}</p>
            <hr />
            <p><b>Customer:</b> {customer?.name}</p>
            <p><b>Contact:</b> {customer?.phone}</p>
            <p><b>Address:</b> {customer?.address}</p>
          </div>

          <table className="bill-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>CGST</th>
                <th>SGST</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => {
                const halfTax = (p.taxAmount / 2).toFixed(2);
                return (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{p.productName}</td>
                    <td>{p.quantity}</td>
                    <td>₹{p.price.toFixed(2)}</td>
                    <td>₹{halfTax}</td>
                    <td>₹{halfTax}</td>
                    <td>₹{(p.price * p.quantity).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="gst-summary">
            <h3>Tax Summary</h3>
            <table className="gst-table">
              <thead>
                <tr>
                  <th>Taxable Amt</th>
                  <th>CGST</th>
                  <th>SGST</th>
                  <th>Total GST</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>₹{subtotal.toFixed(2)}</td>
                  <td>₹{cgst.toFixed(2)}</td>
                  <td>₹{sgst.toFixed(2)}</td>
                  <td>₹{totalGST.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            <h2>Total Payable: ₹{grandTotal.toFixed(2)}</h2>
          </div>

          <div className="bill-footer">
            <p>Prices are inclusive of all taxes.</p>
            <p><b>Thank You! Visit Again 🙏</b></p>
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="actions-section">
          <h3>Bill Actions</h3>
          <button onClick={handlePrint}>🖨 Print Bill</button>
          <button onClick={handleSavePDF}>💾 Save as PDF</button>
          <button onClick={handleSendMail} disabled={loading}>
            {loading ? "Sending..." : "📧 Send Mail"}
          </button>

          {paymentMode === "Online" && (
            <button
              onClick={handleRazorpayPayment}
              className="payment-btn"
              disabled={isPaying || isPaymentDone}
            >
              {isPaying
                ? "Processing Payment..."
                : isPaymentDone
                  ? "Payment Done ✅"
                  : "Make Bill Payment"}
            </button>
          )}
{/*  */}
          <hr />
          <button onClick={() => router.push("/customer")}>➕ Add New Customer</button>
          <button onClick={() => router.back()}>⬅️ Go Back</button>
        </div>
      </div>
    </div>
  );
}
