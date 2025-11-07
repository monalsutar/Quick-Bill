"use client";

import { Suspense } from "react";
// import { useRouter } from "next/navigation";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";

import generateBillPDF from "../utils/generateBillPDF";
import "./proceed.css"
import { signOut, useSession } from "next-auth/react";

import { useRef } from "react";
import localforage from "localforage";

import printBill from "../utils/printBill";


export const dynamic = "force-dynamic"; // ✅ prevent prerendering
export const fetchCache = "force-no-store"; // ✅ disable static caching



export default function ProceedPage() {
  // const router = useRouter();

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

  const [showSuggestions, setShowSuggestions] = useState(false);

  const [categories, setCategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);


  const handleGenerateBill = async () => {
    if (!customer || !products.length) {
      alert("Please add customer and at least one product before generating a bill.");
      return;
    }

    const billData = {
      customer,
      products,
      paymentMode,
      date: new Date().toLocaleDateString("en-GB"),
      merchant: {
      name: session?.user?.name || "Quick Bill Merchant",
      email: session?.user?.email || "quickbill@gmail.com",
      phone: session?.user?.phone || "+91 7856324109",
      shopName: session?.user?.shopName || "Quick Bill Shop",
    },
    };

    try {
      const res = await axios.post("/api/bills", {
        customerName: customer.name,
        items: products,
        totalAmount: products.reduce((acc, p) => acc + p.price * p.quantity, 0),
        date: new Date().toISOString(),
      });

      // alert("Bill stored successfully!");

      const encodedData = encodeURIComponent(JSON.stringify(billData));
      router.push(`/billdisplay?data=${encodedData}`);


    } catch (error) {
      console.error("Error saving bill:", error);
      alert("Failed to save bill to DB.");
    }
  };





  // inside ProceedPage
  const printRef = useRef();

  const gstRates = {
    // 🥛 Dairy & Animal Products
    "Milk": 5, "Cream": 5, "Curd": 5, "Butter": 12, "Ghee": 12, "Cheese": 12, "Honey": 5, "Egg": 5, "Paneer": 5,

    // 🌾 Food Grains & Staples
    "Rice": 5, "Wheat": 5, "Flour": 5, "Cereals": 5, "Pulses": 5, "Atta": 5, "Suji": 5,

    // 🍪 Processed Food & Beverages
    "Snacks": 12, "Sweets": 5, "Chocolate": 18, "Soft Drinks": 28, "Fruit Juice": 12, "Packaged Water": 12,
    "Tea": 5, "Coffee": 5, "Biscuit": 12, "Bread": 5,

    // 🧴 Personal Care
    "Toothpaste": 18, "Soap": 18, "Shampoo": 18, "Cosmetics": 18, "Perfume": 18, "Deodorant": 18,

    // 🧻 Stationery & Office
    "Pen": 12, "Notebook": 12, "Paper": 12, "Printer": 18, "Ink": 18,


    // Default fallback
    "Others": 12,
  };


  const saveBillOffline = async (bill) => {
    const bills = (await localforage.getItem("offlineBills")) || [];
    bills.push(bill);
    await localforage.setItem("offlineBills", bills);
    console.log("Bill saved locally (offline mode)");
  };

  const syncOfflineData = async () => {
    const offlineBills = await localforage.getItem("offlineBills");
    if (offlineBills && offlineBills.length > 0) {
      for (const bill of offlineBills) {
        try {
          await axios.post("/api/bills", bill);
        } catch (err) {
          console.error("Sync failed for bill:", bill, err);
        }
      }
      await localforage.removeItem("offlineBills");
      console.log("All offline bills synced successfully!");
    }
  };

  // Automatically detect internet status
  useEffect(() => {
    window.addEventListener("online", syncOfflineData);
    return () => window.removeEventListener("online", syncOfflineData);
  }, []);

  //fetch customer
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


  // ✅ Autofill products from URL
  // ✅ Auto-fill products from URL
  useEffect(() => {
    const productData = searchParams.get("products");
    if (productData) {
      try {
        const parsed = JSON.parse(decodeURIComponent(productData));
        setProducts(parsed);
      } catch (err) {
        console.error("Error parsing product data:", err);
      }
    }
  }, [searchParams]);

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

  // Fetch stock categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get("/api/stock");
        // Extract unique categories
        const uniqueCategories = [...new Set(res.data.map((item) => item.category))];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error(error);
      }
    };

    fetchCategories();
  }, []);


  //fetch product name
  useEffect(() => {
    const fetchFilteredProducts = async () => {
      try {
        const res = await axios.get("/api/stock");
        const productsForCategory = res.data
          .filter((item) => item.category === category)
          .map((item) => item.productName);
        setFilteredProducts(productsForCategory);
      } catch (err) {
        console.error(err);
      }
    };

    if (category) fetchFilteredProducts();
  }, [category]);


  //Autofill Price
  useEffect(() => {
    const fetchPrice = async () => {
      if (!productName) return;
      try {
        const res = await axios.get("/api/stock");
        const stockItem = res.data.find((s) => s.productName === productName && s.category === category);
        if (stockItem) setPrice(stockItem.price);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPrice();
  }, [productName, category]);



  if (!customer)
    return <p style={{ textAlign: "center", marginTop: "50px" }}>Loading customer data...</p>;



  const handleAddProduct = async () => {
    if (!productName || !category || !quantity) return;


    const qty = parseInt(quantity);

    // ✅ Prevent invalid quantities
    if (!qty || qty < 1) {
      alert("Quantity must be at least 1.");
      return;
    }


    try {
      const res = await axios.get("/api/stock");
      const stockItem = res.data.find((s) => s.productName === productName && s.category === category);

      if (!stockItem) {
        alert("Product not found in stock!");
        return;
      }

      if (stockItem.quantityAvailable < quantity) {
        alert(`Only ${stockItem.quantityAvailable} units available in stock!`);
        return;
      }

      const priceValue = stockItem.price; // MRP includes GST
      const qty = parseInt(quantity);

      // Extract GST from MRP
      const gstRate = gstRates[productName] || 12; // default 12%
      const totalWithGST = priceValue * qty;
      const taxAmount = (totalWithGST * gstRate) / (100 + gstRate); // GST portion for display


      setProducts([
        ...products,
        {
          productName,
          category,
          price: priceValue,
          quantity: parseInt(quantity),
          gstRate,
          taxAmount,
          totalWithGST,
        },
      ]);

      // Reduce stock
      await axios.post("/api/updateStock", {
        productName,
        quantitySold: parseInt(quantity),
      });

      setProductName("");
      setCategory("");
      setPrice("");
      setQuantity("");
    } catch (err) {
      console.error(err);
      alert("Error adding product!");
    }
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


  const handlePrint = () => printBill(customer, products, session, printRef);



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
        <div className="left-panel-product">
          <img src="/logo4.png" alt="Logo" className="logo" />

          <div className="form-card-product">
            <h2>Fill the Product Details</h2>


            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="category"
            >
              <option value="">Select Category</option>
              {categories.map((cat, i) => (
                <option key={i} value={cat}>
                  {cat}
                </option>
              ))}
            </select>


            

            <select
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              disabled={!category}
              className="category">
              <option value="">Select Product</option>
              {filteredProducts.map((p, i) => (
                <option key={i} value={p}>{p}</option>
              ))}
            </select>



            {/* <input type="number" placeholder="Enter Product Price" value={price} onChange={(e) => setPrice(e.target.value)} /> */}
            <input
              type="number"
              placeholder="Product Price"
              value={price}
              readOnly
            />


            <input type="number" placeholder="Enter Product Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} />

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

          {/* Footer */}
          <p style={{ textAlign: "center", marginTop: "20px", fontSize: "12px", color: "#555" }}>
            © 2025 QuickBill. All rights reserved.
          </p>
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
                {session?.user?.image && (
                <img
                  src={session.user.image}
                  alt="profile"
                  style={{
                    width: "35px",
                    height: "35px",
                    borderRadius: "50%",
                    marginRight: "8px",
                    verticalAlign: "middle"
                  }}
                />
              )}
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
                  <th>#</th><th>Category</th><th>Product</th><th>Price</th><th>Qty</th>
                  <th>GST %</th>
                  <th>GST Amt</th>
                  <th>Total (with GST)</th>
                  {/* <th>Total</th> */}
                </tr>
              </thead>
              <tbody>

                {Array.isArray(products) && products.length > 0 ? (
                  products.map((p, i) => (
                    <tr
                      key={i}
                      className={`product-row ${selectedRows.includes(i) ? "selected-row" : ""}`}
                      onClick={() => toggleRowSelection(i)}
                    >
                      <td>{i + 1}</td>
                      <td>{p.category || "N/A"}</td>
                      <td>{p.productName || "Unnamed Product"}</td>
                      <td>₹{(p.price || 0).toFixed(2)}</td>
                      <td>{p.quantity || 0}</td>
                      <td>{p.gstRate ? `${p.gstRate}%` : "0%"}</td>
                      <td>₹{(p.taxAmount || 0).toFixed(2)}</td>
                      <td>₹{(p.totalWithGST || (p.price || 0) * (p.quantity || 0)).toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: "10px" }}>
                      No products available
                    </td>
                  </tr>
                )}


              </tbody>
            </table>

          </div>


          {/* generate bill */}
          {products.length > 0 && !showPopup && (
            <button className="generate-bill-btn" onClick={handleGenerateBill}>
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
                    Download Bill PDF
                  </button>

                  <button onClick={handleSendMail} disabled={loading} className="mail-btn">
                    {loading ? "Sending...Bill" : "Send Bill via Mail"}
                  </button>
                </div>

                <button
                  className="cancel-btn"
                  onClick={() => setShowPopup(false)}
                >
                  Cancel
                </button>

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




        </div>
      </div>

    </>
  );

}
