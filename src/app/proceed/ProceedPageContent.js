"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // <-- IMPORT THIS WAY
import LOGO from "/public/logo.png"
import generateBillPDF from "../utils/generateBillPDF";
import "./proceed.css"
import { signOut, useSession } from "next-auth/react";

import { useRef } from "react";

export const dynamic = "force-dynamic"; // ✅ prevent prerendering
export const fetchCache = "force-no-store"; // ✅ disable static caching



export default function ProceedPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const customerId = searchParams.get("customerId");
  const [customer, setCustomer] = useState(null);
  const [products, setProducts] = useState([]);
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");

  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });



  const [paymentMode, setPaymentMode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  // const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const [showPopup, setShowPopup] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  // inside ProceedPage
  const printRef = useRef();



  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const res = await axios.get("/api/customers");
        const cust = res.data.find((c) => c._id === customerId);
        setCustomer(cust);
      } catch (err) {
        console.error(err);
      }
    };
    if (customerId) fetchCustomer();
  }, [customerId]);

  // Load Razorpay checkout script
  useEffect(() => {
    if (!document.getElementById("razorpay-script")) {
      const script = document.createElement("script");
      script.id = "razorpay-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);


  if (!customer)
    return <p style={{ textAlign: "center", marginTop: "50px" }}>Loading customer data...</p>;

  const handleAddProduct = () => {
    if (!productName || !category || !price || !quantity) return;
    setProducts([
      ...products,
      { productName, category, price: parseFloat(price), quantity: parseInt(quantity) },
    ]);
    setProductName("");
    setCategory("");
    setPrice("");
    setQuantity("");
  };

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    router.push("/");
  };


  const handleSaveBill = () => {
    if (!customer || products.length === 0) {
      alert("Please add customer and products before saving the bill.");
      return;
    }
    setLoading(true); // start loader
    generateBillPDF(customer, products, paymentMode, setLoading);

  };


  // Inside ProceedPage component, after your existing useState


  // Updated handleSendMail
  const handleSendMail = async () => {
    if (!customer.email) {
      setMessage("Customer email is required!");
      return;
    }

    if (products.length === 0) {
      setMessage("Add at least one product to send the bill.");
      return;
    }

    setLoading(true);
    setMessage("");

    // ✅ Build billData from products
    const billData = products.map((p) => ({
      category: p.category,
      product: p.productName,
      price: p.price.toFixed(2),
      quantity: p.quantity,
      total: (p.price * p.quantity).toFixed(2),
    }));

    try {
      const response = await axios.post("/api/sendMail", {
        to: customer.email,
        subject: "Your Bill from BillDesk",
        billData: billData, // <-- must send array
      });

      if (response.data.success) {
        setMessage("Mail sent successfully! ✅");
        alert("Bill Mail Sent Successfully....")
      } else {
        setMessage("Failed to send mail: " + response.data.message);
      }



    } catch (error) {
      console.error("Axios error:", error);
      if (error.response) {
        console.error("Axios response error:", error.response.data);
        setMessage("Error: " + (error.response.data.message || "Unknown server error"));
      } else if (error.request) {
        console.error("Axios request error:", error.request);
        setMessage("Error sending request.");
      } else {
        setMessage("Error: " + error.message);
      }
    } finally {
      setLoading(false); // stop loader
    }
  };


  const toggleRowSelection = (index) => {
    setSelectedRows((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedRows.length === 0) return;
    if (!confirm(`Delete ${selectedRows.length} product(s)?`)) return;

    const updatedProducts = products.filter((_, i) => !selectedRows.includes(i));
    setProducts(updatedProducts);
    setSelectedRows([]); // clear selection
  };



  //Print function
  const handlePrint = () => {
    if (!printRef.current) return;

    const printContent = printRef.current.innerHTML;

    // Merchant details
    const merchantName = session?.user?.name || "Bill Desk Merchant";
    const merchantEmail = session?.user?.email || "merchant@billdesk.com";

    // Customer details
    const customerDetails = `
    <p><strong>Customer Name:</strong> ${customer.name}</p>
    <p><strong>Customer Email:</strong> ${customer.email}</p>
    <p><strong>Customer Phone:</strong> ${customer.phone || "-"}</p>
    
  `;

    // Calculate total amount
    const totalAmount = products.reduce((acc, p) => acc + p.price * p.quantity, 0).toFixed(2);

    const printWindow = window.open("", "", "width=800,height=600");
    printWindow.document.write(`
    <html>
      <head>
        <title>Print Bill</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h4 { text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid black; padding: 8px; text-align: left; }
          th { background: #f2f2f2; }
          .merchant, .customer { margin-bottom: 20px; }
          .total { margin-top: 20px; font-weight: bold; font-size: 16px; text-align: right; }
          .footer { text-align: center; margin-top: 40px; font-style: italic; }
        </style>
      </head>


      <body>
      <h3>Bill Desk Billing Application</h3>
        <div class="merchant">
          <p><strong>Merchant Name:</strong> ${merchantName}</p>
          <p><strong>Merchant Email:</strong> ${merchantEmail}</p>
        </div>

        <div class="customer">
          ${customerDetails}
        </div>

        ${printContent}

        <p class="total">Total Amount: ₹${totalAmount}</p>

        <div class="footer">
          Bill Desk Billing Application
        </div>
      </body>
    </html>
  `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };




  //Payment
  const handleRazorpayPayment = async () => {
    if (!products.length) return alert("Add products first");

    if (!window.Razorpay) {
      alert("Razorpay SDK failed to load. Please refresh the page.");
      return;
    }

    const totalAmount = products.reduce((acc, p) => acc + p.price * p.quantity, 0) * 100; // in paise

    try {
      const { data: order } = await axios.post("/api/createOrder", {
        amount: totalAmount,
        currency: "INR",
      });

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Quick Bill",
        description: "Purchase Bill",
        order_id: order.id,
        handler: async function (response) {
          try {
            const verifyRes = await axios.post("/api/verifyPayment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.data.success) {
              alert("Payment Successful ✅");
            } else {
              alert("Payment verification failed ❌");
            }
          } catch (err) {
            console.error(err);
            alert("Error verifying payment");
          }
        },
        prefill: {
          name: customer.name,
          email: customer.email,
        },
        theme: {
          color: "#3399cc",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error(error);
      alert("Payment failed: " + error.message);
    }
  };



  return (
    <>
      {loading && (
        <div className="loader-backdrop">
          <div className="loader"></div>
        </div>
      )}
      <div className="proceed-container">
        <div className="left-panel">
          <img src="/logo4.png" alt="Logo" className="logo" />

          <div className="form-card">
            <h2>Add Product Details</h2>


            <select value={category} onChange={(e) => setCategory(e.target.value)} className="category">
              <option value="">Select Category</option>
              <option value="Food">Food</option>
              <option value="Groceries">Groceries</option>
              <option value="Clothing">Clothing</option>
              <option value="Electronics">Electronics</option>
              <option value="Furniture">Furniture</option>
              <option value="Stationery">Stationery</option>
              <option value="Accessories">Accessories</option>
              <option value="Cosmetics">Cosmetics</option>
              <option value="Others">Others</option>
            </select>

            <input type="text" placeholder="Product Name" value={productName} onChange={(e) => setProductName(e.target.value)} />
            <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
            <input type="number" placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} />

            <div className="payment-mode">
              <div className="payment-options">
                <label>Payment Mode:</label>
                <label><input type="radio" name="payment" value="Cash" defaultChecked="true" onChange={(e) => setPaymentMode(e.target.value)} />Cash</label>
                <label><input type="radio" name="payment" value="Card" onChange={(e) => setPaymentMode(e.target.value)} /> Card</label>
                <label><input type="radio" name="payment" value="Online" onChange={(e) => setPaymentMode(e.target.value)} /> UPI</label>
              </div>
            </div>

            <button onClick={handleAddProduct} className="add-btn">Add Product</button>
          </div>
        </div>


        <div className="right-panel">

          <div className="right-header">

            <h2>Product List</h2>
            <p className="right-date">Date : {today}</p>

            {/* Show "Hi, Merchant" or logged-in name */}
            <div className="merchant-info">
              <button
                className="merchant-name"
                onClick={() => setShowLogout(!showLogout)}
              >
                {session?.user?.name ? `Hi, ${session.user.name}👋` : "Hi, Merchant👋"}
              </button>

              {showLogout && (
                <div className="logout-popup">
                  <button
                    className="logout-btn"
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>



          </div>



          {selectedRows.length > 0 && (
            <div className="delete-selected-container">
              <button
                onClick={handleDeleteSelected}
                className="delete-selected-btn"
              >
                Delete Selected ({selectedRows.length})
              </button>
            </div>
          )}

          <div ref={printRef}>
            <table className="product-table">
              <thead>
                <tr>
                  <th>#</th><th>Category</th><th>Product</th><th>Price</th><th>Qty</th><th>Total</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => (
                  <tr key={i} className={`product-row ${selectedRows.includes(i) ? "selected-row" : ""}`} onClick={() => toggleRowSelection(i)}>
                    <td>{i + 1}</td>
                    <td>{p.category}</td>
                    <td>{p.productName}</td>
                    <td>₹{p.price.toFixed(2)}</td>
                    <td>{p.quantity}</td>
                    <td>₹{(p.price * p.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

          </div>


          {products.length > 0 && !showPopup && (
            <button className="generate-bill-btn" onClick={() => setShowPopup(true)}>
              🧾 Generate Bill
            </button>
          )}

          {showPopup && (
            <div className="popup-backdrop">
              <div className="popup-content">
                <div className="popup-tick">
                  <img
                    src="/logo4.png"
                    alt="Quick Bill Logo"
                  />
                </div>
                <div className="popup-message">Quick Bill Generated your Bill Successfully!</div>
                <div className="popup-submessage">
                  Now take your bill in different forms:
                </div>

                  {paymentMode === "Online" && (
                    <button onClick={handleRazorpayPayment} className="payment-btn">
                      Make Bill Payment ✅
                    </button>
                  )}
                <div className="popup-buttons">

                  <button onClick={handlePrint} className="print-btn">
                    Print your Bill
                  </button>

                  <button onClick={handleSaveBill} className="save-btn">
                    Download bill PDF
                  </button>

                  <button onClick={handleSendMail} disabled={loading} className="mail-btn">
                    {loading ? "Sending...Bill" : "Send Bill via Mail"}
                  </button>
                </div>

                <button
                  className="done-btn"
                  onClick={() => router.push("/customer")}
                >
                  Done
                </button>

                <div className="popup-footer">
                  Thank you for billing with us!
                </div>
              </div>
            </div>
          )}




          {/* <div className="action-buttons">

            {paymentMode === "Online" && (
              <button onClick={handleRazorpayPayment} className="payment-btn">
                💳 Make Payment
              </button>
            )}

            <button onClick={handlePrint} className="print-btn">
              🖨 Print Bill
            </button>


            <button onClick={handleSaveBill} className="save-btn">📄Save Bill PDF</button>

            <button onClick={handleSendMail} disabled={loading} className="mail-btn">
              {loading ? "Sending...📤" : "📤Send Bill Mail"}
            </button>
          </div> */}





        </div>
      </div>

    </>
  );

}
