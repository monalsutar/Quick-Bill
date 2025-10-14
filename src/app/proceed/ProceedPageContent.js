"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // <-- IMPORT THIS WAY
import LOGO from "/public/logo.png"
import generateBillPDF from "../utils/generateBillPDF";

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
  const today = new Date().toLocaleDateString();
  const [paymentMode, setPaymentMode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);



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
    generateBillPDF(customer, products, paymentMode);
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
      setLoading(false);
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



  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width : "100%",
        fontFamily: "Arial, sans-serif",
        background: "linear-gradient(135deg, #ffffff, #ccd3e8ff)",
        flexWrap: "wrap",
      }}
    >
      {/* Left Panel - Product Form */}
      <div
        style={{
          flex: 5,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "50px 80px",
          backgroundColor: "#6d91ff29",
          position: "relative",
        }}
      >
        {/* Logo at Top Left */}
        <img
          src="/logo.png"
          alt="Logo"
          style={{
            position: "absolute",
            top: "25px",
            left: "35px",
            width: "150px",
          }}
        />



        {/* Form Card */}
        <div
          style={{
            width: "420px",
            backgroundColor: "#fff",
            padding: "40px 35px",
            borderRadius: "15px",
            boxShadow: "0 8px 25px rgba(0, 0, 0, 0.1)",
            textAlign: "center",
            flex: "1 1 400px",
          }}
        >
          <h2
            style={{
              fontSize: "28px",
              color: "#1a1a1a",
              marginBottom: "25px",
              fontWeight: "bold",
            }}
          >
            Add Product Details
          </h2>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              marginBottom: "15px",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              fontSize: "16px",
              width: "97%",
              backgroundColor: "#fff",
              cursor: "pointer",
            }}
          >
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


          <input
            type="text"
            placeholder="Product Name"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            style={{
              marginBottom: "15px",
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              fontSize: "16px",
              width: "90%",
              color: "black"
            }}
          />

          <input
            type="number"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            style={{
              marginBottom: "15px",
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              fontSize: "16px",
              width: "90%",
              color: "black"
            }}
          />

          <input
            type="number"
            placeholder="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            style={{
              marginBottom: "25px",
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              fontSize: "16px",
              width: "90%",

            }}
          />

          {/* 🔘 Payment Mode Section */}
          <div
            style={{
              marginBottom: "25px",
              textAlign: "left",
              fontSize: "16px",
              color: "#333",
            }}
          >
            <label style={{ fontWeight: "bold", marginBottom: "8px", display: "block" }}>
              Payment Mode:
            </label>
            <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
              <label>
                <input
                  type="radio"
                  name="payment"
                  value="Cash"
                  onChange={(e) => setPaymentMode(e.target.value)}
                />{" "}
                Cash
              </label>
              <label>
                <input
                  type="radio"
                  name="payment"
                  value="Card"
                  onChange={(e) => setPaymentMode(e.target.value)}
                />{" "}
                Card
              </label>
              <label>
                <input
                  type="radio"
                  name="payment"
                  value="Online"
                  onChange={(e) => setPaymentMode(e.target.value)}
                />{" "}
                Online
              </label>
            </div>
          </div>


          <button
            onClick={handleAddProduct}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: "#08437A",
              color: "white",
              fontSize: "17px",
              fontWeight: "bold",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "0.3s",
              boxShadow: "0 4px 12px rgba(0,112,243,0.3)",
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#0057c2")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "#08437A")}
          >
            Add Product
          </button>
        </div>
      </div>

      {/* Right Panel - Product List */}
      {/* Logout Button Top Right */}
      <button
        onClick={handleLogout}
        style={{
          position: "absolute",
          top: "25px",
          right: "68px",
          backgroundColor: "#ff4d4d",
          color: "white",
          padding: "8px 16px",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          fontWeight: "bold",
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => (e.target.style.backgroundColor = "#e04343")}
        onMouseLeave={(e) => (e.target.style.backgroundColor = "#ff4d4d")}
      >
        Logout
      </button>
      <div
        style={{
          flex: 5,
          backgroundColor: "#ffffff",
          padding: "50px 70px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          borderLeft: "1px solid #e0e0e0",
          flex: "1 1 400px", // table
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "26px", color: "#222" }}>Product List</h2>
          <p style={{ color: "#666" }}>{today}</p>
        </div>



        {/* Product Table */}
        <div style={{ flexGrow: 1, overflowY: "auto", marginTop: "20px" }}>
          {selectedRows.length > 0 && (
            <div style={{ textAlign: "right", marginBottom: "10px" }}>
              <button
                onClick={handleDeleteSelected}
                style={{
                  
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 14px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Delete Selected ({selectedRows.length})
              </button>
            </div>
          )}

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
              borderRadius: "10px",

            }}
          >
            <thead style={{ backgroundColor: "#0071f3d8", color: "white" }}>
              <tr>
                <th style={{ padding: "10px" }}>#</th>
                <th style={{ padding: "10px" }}>Category</th>
                <th style={{ padding: "10px" }}>Product</th>
                <th style={{ padding: "10px" }}>Price</th>
                <th style={{ padding: "10px" }}>Qty</th>
                <th style={{ padding: "10px" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr
                  key={i}
                  onClick={() => toggleRowSelection(i)}
                  style={{
                    textAlign: "center",
                    borderBottom: "1px solid #ddd",
                    backgroundColor: selectedRows.includes(i) ? "#e6fd4bff" : "white",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                >
                  <td style={{ padding: "10px" }}>{i + 1}</td>
                  <td style={{ padding: "10px" }}>{p.category}</td>
                  <td style={{ padding: "10px" }}>{p.productName}</td>
                  <td style={{ padding: "10px" }}>₹{p.price.toFixed(2)}</td>
                  <td style={{ padding: "10px" }}>{p.quantity}</td>
                  <td style={{ padding: "10px" }}>₹{(p.price * p.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>

        {/* Action Buttons */}
        <div style={{ marginTop: "30px", textAlign: "right" }}>
          <button
            onClick={handleSaveBill}
            style={{
              marginRight: "10px",
              padding: "10px 20px",
              backgroundColor: "green",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Save Bill PDF
          </button>

          <button
            onClick={handleSendMail}
            disabled={loading}
            style={{
              padding: "10px 20px",
              backgroundColor: "#292eb8ff",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            {loading ? "Sending..." : "Send Bill Mail"}
          </button>
        </div>
      </div>
    </div>
  );
}
