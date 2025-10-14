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
  // const [loading, setLoading] = useState(false);



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



  return (
    <>
      {loading && (
        <div className="loader-backdrop">
          <div className="loader"></div>
        </div>
      )}
      <div className="proceed-container">
        <div className="left-panel">
          <img src="/logo.png" alt="Logo" className="logo" />

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
                <label><input type="radio" name="payment" value="Online" onChange={(e) => setPaymentMode(e.target.value)} /> Online</label>
              </div>
            </div>

            <button onClick={handleAddProduct} className="add-btn">Add Product</button>
          </div>
        </div>


        <div className="right-panel">

          <div className="right-header">
            <button onClick={handleLogout} className="logout-btn">Logout</button>
            <h2>Product List</h2>
            <p className="right-date">{today}</p>

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

          <div className="action-buttons">
            <button onClick={handleSaveBill} className="save-btn">Save Bill PDF</button>
            <button onClick={handleSendMail} disabled={loading} className="mail-btn">
              {loading ? "Sending..." : "Send Bill Mail"}
            </button>
          </div>
        </div>
      </div>

    </>
  );

}
