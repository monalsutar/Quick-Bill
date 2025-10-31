"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
// import generateBillPDF from "../utils/generateBillPDF";
import printBill from "../utils/printBill";
import "./billdisplay.css";
import { signOut, useSession } from "next-auth/react";

export default function BillDisplay() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const router = useRouter();
  const [billData, setBillData] = useState(null);
  const [loading, setLoading] = useState(false);
  // const [paymentLoading, setPaymentLoading] = useState(false);
  // const [paymentDone, setPaymentDone] = useState(false);
  // const [showLogout, setShowLogout] = useState(false);
  const printRef = useRef();



  // State for loader and payment status
  const [isPaying, setIsPaying] = useState(false);
  const [isPaymentDone, setIsPaymentDone] = useState(false);

 useEffect(() => {
  const data = searchParams.get("data");
  if (data) {
    try {
      const parsed = JSON.parse(decodeURIComponent(data));
      setBillData(parsed);
    } catch (err) {
      console.error("Error parsing bill data:", err);
    }
  }
}, [searchParams]);



  useEffect(() => {
    const customerParam = searchParams.get("customer");
    if (customerParam) {
      try {
        const parsedCustomer = JSON.parse(decodeURIComponent(customerParam));
        setBillData((prev) => ({ ...prev, customer: parsedCustomer }));
      } catch (err) {
        console.error("Error parsing customer data:", err);
      }
    }
  }, [searchParams]);


  useEffect(() => {
    const billId = searchParams.get("id");

    if (billId) {
      axios.get(`/api/bills?id=${billId}`)
        .then((res) => {
          if (res.data.success) {
            setBillData(res.data.bill);
          } else {
            console.error(res.data.message);
          }
        })
        .catch((err) => console.error("Error fetching bill:", err));
    } else {
      const data = searchParams.get("data");
      if (data) setBillData(JSON.parse(decodeURIComponent(data)));
    }
  }, [searchParams]);



  useEffect(() => {
    const productData = searchParams.get("products");
    if (productData) {
      try {
        const parsedProducts = JSON.parse(decodeURIComponent(productData));
        setProducts(parsedProducts); // ✅ Autofill table
      } catch (err) {
        console.error("Error parsing products:", err);
      }
    }
  }, [searchParams]);


  if (!billData) return <p style={{ textAlign: "center", marginTop: "40px" }}>Loading Bill...</p>;

  const { customer, products = [], paymentMode, date } = billData || {};
  // const products = items; // ✅ Use the same variable name for rest of code

  // ✅ Prevent runtime crash
  const subtotal = products.reduce((acc, p) => acc + (p.price || 0) * (p.quantity || 0), 0);
  const totalGST = products.reduce((acc, p) => acc + (p.taxAmount || 0), 0);
  const cgst = totalGST / 2;
  const sgst = totalGST / 2;
  const grandTotal = subtotal;


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

  // const handleSavePDF = () => generateBillPDF(customer, products, paymentMode, setLoading);
  const handlePrint = () => printBill(customer, products, null, printRef);

  return (
    <div className="billdisplay-wrapper">
      <div className="invoice-container" ref={printRef}>
        <div className="invoice-header">
          <div className="invoice-logo">
            <img src="../logo4.png" style={{ height: "40px", }} />
          </div>
          <div className="invoice-company">
            <h2>Quick Bill Application</h2>
            {/* <p>Add Address</p> */}
            <p>
              Mobile: +91 1023456789 | Email: quickbill@gmail.com
            </p>
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
            <p><b>{session?.user?.name || "Quick Bill Merchant"}</b></p>
            <p>{session?.user?.shopName || "Quick Bill Shop"}</p>
            {/* <p>{session?.user?.address || merchant?.address || "Billing Application"}</p> */}
            <p>{session?.user?.phone || "+91 7856324109"}</p>
            <p>{session?.user?.email || "quickbill@gmail.com"}</p>
          </div>


          <div className="shipping">
            <h4>Shipping (Customer) Details</h4>
            <p><b>{customer?.name}</b></p>
            <p>{customer?.address}</p>
            <p>{customer?.phone}</p>
            <p>{customer?.email}</p>
          </div>
        </div>

        <table className="items-table">
          <thead>
            <tr>
              <th>Sr</th>
              <th>Item Description</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Rate</th>
              <th>Tax %</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{p.productName}</td>
                <td>{p.quantity}</td>
                <td>{p.productName?.toLowerCase().includes("milk")
                  ? "ltr"
                  : p.unit || "pcs"}</td>
                <td>₹{p.price.toFixed(2)}</td>
                <td>{p.taxPercent || 18}%</td>
                <td>₹{(p.price * p.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="invoice-summary">
          <p><b>Sub Total:</b> ₹{subtotal.toFixed(2)}</p>
          <p><b>CGST:</b> ₹{cgst.toFixed(2)}</p>
          <p><b>SGST:</b> ₹{sgst.toFixed(2)}</p>
          <p><b>Total Payable:</b> ₹{grandTotal.toFixed(2)}</p>
        </div>

        <div className="invoice-footer">
          <div className="terms">
            <h4>Terms & Conditions</h4>
            <p>1. Goods once sold will not be taken back.</p>
            <p>2. Subject to local jurisdiction only.</p>
          </div>
          {/* <div className="bank">
            <h4>Bank Details</h4>
            <p>Account No: 123456789</p>
            <p>Bank: ICICI</p>
            <p>IFSC: ICIC0000123</p>
            <p>Branch: Pune</p>
          </div> */}
          <div className="signature">
            <p>For Quick Bill Application</p>
            <br />
            <p>Authorized Signature</p>
          </div>
        </div>
      </div>

      {/* Bill Actions */}
      <div className="actions-section-bill">

        <h3>Quick Bill Actions</h3>


        <button onClick={handlePrint}>🖨 Print Bill</button>

        <button onClick={handleSendMail} disabled={loading}>
          {loading ? "Sending...📧" : " Send Bill Email 📧"}
        </button>
        {paymentMode === "Online" && (
          <button
            onClick={handleRazorpayPayment}
            disabled={isPaying || isPaymentDone}
            className="paid-btn"
          >
            {isPaying ? "Processing Payment..." : isPaymentDone ? "Payment Done ✅" : "Make Bill Payment"}
          </button>
        )}
        <hr />

        <button className="logout-btn-bill" onClick={() => signOut({ callbackUrl: "/login" })}>
          Logout ➡️
        </button>

        <button onClick={() => router.push("/customer")}>Add New Customer ➕</button>
        {/* <button onClick={() => router.push(`/proceed?products=${encodeURIComponent(JSON.stringify(products))}`)}>
          ⬅️ Go Back
        </button> */}
      </div>
    </div>
  );
}