"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import printBill from "../utils/printBill";
import "./billdisplay.css";
import { signOut, useSession } from "next-auth/react";

export default function BillDisplay() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const router = useRouter();

  const [billData, setBillData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isPaymentDone, setIsPaymentDone] = useState(false);
  const [merchant, setMerchant] = useState({});
  const printRef = useRef();

  // ✅ Load Razorpay Script once
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // ✅ Fetch bill + customer
  useEffect(() => {
    const billId = searchParams.get("id");
    const dataParam = searchParams.get("data");
    const customerParam = searchParams.get("customer");

    if (billId) {
      axios.get(`/api/bills?id=${billId}`)
        .then((res) => res.data.success && setBillData(res.data.bill))
        .catch(console.error);
    } else if (dataParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(dataParam));
        setBillData(parsed);
      } catch (err) {
        console.error("Error parsing bill data:", err);
      }
    }

    if (customerParam) {
      try {
        const parsedCustomer = JSON.parse(decodeURIComponent(customerParam));
        setBillData((prev) => ({ ...prev, customer: parsedCustomer }));
      } catch (err) {
        console.error("Error parsing customer data:", err);
      }
    }
  }, [searchParams]);

  // ✅ Fetch merchant details
  useEffect(() => {
    if (session?.user?.email) {
      axios.get(`/api/merchant?email=${session.user.email}`)
        .then(res => setMerchant(res.data))
        .catch(console.error);
    }
  }, [session]);

  if (!billData)
    return <p style={{ textAlign: "center", marginTop: "40px" }}>Loading Bill...</p>;

  const { customer, products = [], paymentMode, date } = billData;

  // ✅ Calculations// ✅ Since MRP includes GST, we display GST but do NOT add it again to total.
  const subtotal = products.reduce((acc, p) => acc + (p.price || 0) * (p.quantity || 0), 0);

  // Calculate GST amount breakdown (for display only)
  const totalGST = products.reduce((acc, p) => {
    const gstPercent = p.taxPercent || 18;
    const basePrice = (p.price * 100) / (100 + gstPercent); // Extract base from MRP
    const gstAmount = (p.price - basePrice) * p.quantity;
    return acc + gstAmount;
  }, 0);

  const cgst = totalGST / 2;
  const sgst = totalGST / 2;

  // ✅ Grand total remains same as subtotal, since MRP already includes GST
  const grandTotal = subtotal;

  // 💳 Razorpay Payment Handler
  const handleRazorpayPayment = async () => {
    if (!products.length) return alert("Add products first");
    if (!window.Razorpay) return alert("Razorpay not loaded yet!");

    setIsPaying(true);
    try {
      const totalAmount = Math.round(grandTotal * 100);
      const { data: order } = await axios.post("/api/createOrder", {
        amount: totalAmount,
        currency: "INR",
      });

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Quick Bill",
        description: "Bill Payment",
        order_id: order.id,
        handler: async function (response) {
          try {
            const verifyRes = await axios.post("/api/verifyPayment", response);
            alert(verifyRes.data.success ? "Payment Successful ✅" : "Payment verification failed ❌");
            setIsPaymentDone(true);
          } catch {
            alert("Error verifying payment");
          }
          setIsPaying(false);
        },
        prefill: {
          name: customer?.name || "",
          email: customer?.email || "",
        },
        theme: { color: "#2d2e83" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error(error);
      alert("Payment failed: " + error.message);
      setIsPaying(false);
    }
  };

  // 📧 Send Mail
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

  const handlePrint = () => printBill(customer, products, null, printRef);

  return (
    <div className="billdisplay-wrapper">

      {/* 🌟 Navbar */}
      <nav className="topbar">
        {/* Left: Logo */}
        <div className="topbar-left">
          <img src="../logo4.png" alt="QuickBill Logo" />
        </div>

        {/* Center: Back Button */}
        <div className="topbar-center">
          <button onClick={() => router.push("/customer")} className="back-btn">
            ← <span>Back to Customers</span>
          </button>
        </div>

        {/* Right: User Info */}
        <div className="topbar-right">

          <div className="user-info">
            <p className="user-name">{session?.user?.name || "User"}</p>
            <p className="user-role">{session?.user?.email || "user@example.com"}</p>
          </div>

          <img
            src={session?.user?.image || "../user.png"}
            alt="User Avatar"
            className="user-avatar"
          />
        </div>
      </nav>

      {/* 💡 Main Layout Container */}
      <div className="bill-main-layout">



        {/* 🧾 Invoice Section */}
        <div className="invoice-container" ref={printRef}>
          <div className="invoice-header">
            <div className="invoice-logo">
              <img src="../logo4.png"/>
            </div>
            <div className="invoice-company">
              <h2>Quick Bill Application</h2>
              <p>Mobile: +91 1023456789 | Email: quickbill@gmail.com</p>
              <p>GSTIN - 29AAAAA1234F000 | PAN - 29AAAAA1234F</p>
            </div>
          </div>

          <div className="invoice-meta">
            <table>
              <tbody>
                <tr>
                  <td><b>Invoice Number:</b></td><td>QB/{Date.now()}</td>
                  <td><b>Invoice Date:</b></td><td>{date}</td>
                </tr>
                <tr>
                  <td><b>Place of Supply:</b></td><td>Maharashtra</td>
                  <td><b>Reverse Charge:</b></td><td>No</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="billing-shipping">
            <div className="billing">
              <h4>Billing (Merchant) Details</h4>
              <p><b>{session?.user?.name}</b></p>
              <p>Quick Bill Shop</p>
              {/* <p>{session?.user?.phone}</p> */}
              <p>{session?.user?.email}</p>
            </div>

            <div className="shipping">
              <h4>Shipping (Customer) Details</h4>
              <p><b>{customer?.name}</b></p>
              <p>{customer?.address}</p>
              <p>{customer?.phone}</p>
              <p>{customer?.email}</p>
            </div>
          </div>

          {/* 🧮 Table */}
          <div class="items-table-container">
          <table className="items-table">
            <thead>
              <tr>
                <th>#</th>
                <th>🏷️ Category</th>
                <th>🛍️ Product</th>
                <th>⚖️ Unit</th>
                <th>💸 Discount %</th>
                <th>💰 Price</th>
                <th>📦 Qty</th>
                <th>GST %</th>
                <th>GST Amt</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{p.category || "-"}</td>
                  <td>{p.productName}</td>
                  <td>{p.unit || "Pcs"}</td>
                  <td>{p.discount || 0}%</td>
                  <td>₹{p.price.toFixed(2)}</td>
                  <td>{p.quantity}</td>
                  {(() => {
                    const gstPercent = p.taxPercent || 18;
                    const basePrice = (p.price * 100) / (100 + gstPercent); // Extract base from MRP
                    const gstAmount = (p.price - basePrice) * p.quantity;
                    const lineTotal = p.price * p.quantity; // MRP * Qty (already includes GST)
                    return (
                      <>
                        <td>{gstPercent}%</td>
                        <td>₹{gstAmount.toFixed(2)}</td>
                        <td>₹{lineTotal.toFixed(2)}</td>
                      </>
                    );
                  })()}

                </tr>
              ))}
            </tbody>
          </table>
          </div>


          <div className="invoice-summary">
            <p><b>Sub Total (Incl. GST):</b> ₹ {subtotal.toFixed(2)}</p>
            <p><b>Estimated CGST:</b> ₹ {cgst.toFixed(2)}</p>
            <p><b>Estimated SGST:</b> ₹ {sgst.toFixed(2)}</p>
            <p><b>Total Payable:</b> ₹ {grandTotal.toFixed(2)}</p>
          </div>

          <div className="invoice-footer">
            <div className="terms">
              <h4>Terms & Conditions</h4>
              <p>1. Goods once sold will not be taken back.</p>
              <p>2. Subject to local jurisdiction only.</p>
            </div>
            <div className="signature">
              <p>For Quick Bill Application</p>
              <br />
              <p>Authorized Signature</p>
            </div>
          </div>

          <p className="thankyou-text">✨ Thank you for shopping with us!</p>
        </div>



        {/* 🎯 Actions Section */}
        {/* 🎯 Quick Bill Actions Panel */}
        <div className="actions-panel">
          <h3>Quick Bill Actions</h3>

          <div className="actions-grid">
            <div className="action-card print" onClick={handlePrint}>
              <div className="icon">🖨️</div>
              <div className="info">
                <h4>Print Generated Bill</h4>
                <p>Generate a print-ready invoice instantly.</p>
              </div>
            </div>

            <div
              className={`action-card mail ${loading ? "disabled" : ""}`}
              onClick={!loading ? handleSendMail : undefined}
            >
              <div className="icon">📧</div>
              <div className="info">
                <h4>Send Bill Email</h4>
                <p>{loading ? "Sending..." : "Email invoice to customer."}</p>
              </div>
            </div>

            {paymentMode === "Online" && (
              <div
                className={`action-card pay ${isPaying || isPaymentDone ? "disabled" : ""
                  }`}
                onClick={!isPaying && !isPaymentDone ? handleRazorpayPayment : undefined}
              >
                <div className="icon">💶</div>
                <div className="info">
                  <h4>{isPaymentDone ? "Bill Payment Complete" : "Make Bill Payment"}</h4>
                  <p>
                    {isPaymentDone
                      ? "This bill has been paid successfully."
                      : "Pay securely using Razorpay."}
                  </p>
                </div>
              </div>
            )}

            <div className="action-card logout" onClick={() => signOut({ callbackUrl: "/login" })}>
              <div className="icon">📤</div>
              <div className="info">
                <h4>Logout</h4>
                <p>Sign out of your Quick Bill account.</p>
              </div>
            </div>
          </div>
        </div>


      </div>

    </div>
  );
}
