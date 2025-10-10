"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";

// Correct import for jsPDF with autotable
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


export default function ProceedPage() {
  const searchParams = useSearchParams();
  const customerId = searchParams.get("customerId");
  const [customer, setCustomer] = useState(null);
  const [products, setProducts] = useState([]);
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");

  const today = new Date().toLocaleDateString();

  // Fetch customer from DB
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

  if (!customer) return <p style={{ textAlign: "center", marginTop: "50px" }}>Loading customer data...</p>;

  const handleAddProduct = () => {
    if (!productName || !category || !price || !quantity) return;
    setProducts([...products, { productName, category, price: parseFloat(price), quantity: parseInt(quantity) }]);
    setProductName(""); setCategory(""); setPrice(""); setQuantity("");
  };

  const handleSaveBill = () => {
    const doc = new jsPDF();

    // Add logo image (make sure logo.png is in /public folder)
    const img = new Image();
    img.src = "/logo.png";
    img.onload = () => {
      doc.addImage(img, "PNG", 10, 10, 40, 10); // x, y, width, height

      // Customer details
      doc.setFontSize(12);
      doc.text(`Name: ${customer.name}`, 140, 10);
      doc.text(`Email: ${customer.email}`, 140, 16);
      doc.text(`Phone: ${customer.phone}`, 140, 22);
      doc.text(`Address: ${customer.address}`, 140, 28);

      // Product table
      const tableData = products.map((p, i) => [
        i + 1,
        p.category,
        p.productName,
        p.price.toFixed(2),
        p.quantity,
        (p.price * p.quantity).toFixed(2),
      ]);

      autoTable(doc, {
        head: [["#", "Category", "Product", "Price", "Quantity", "Total"]],
        body: tableData,
        startY: 40,
      });

      const finalY = doc.lastAutoTable?.finalY || 50;
      const totalAmount = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
      doc.text(`Final Bill: $${totalAmount.toFixed(2)}`, 140, finalY + 10);

      doc.save(`Bill_${new Date().toISOString()}.pdf`);
    };
  }

    return (
      <div style={{ display: "flex", height: "100vh", fontFamily: "Arial, sans-serif" }}>
        {/* Left Panel */}
        <div style={{ flex: 1, padding: "20px", borderRight: "1px solid #ccc" }}>
          <img src="/logo.png" alt="Logo" style={{ width: "150px" }} />
          
          <h2>Add Product Details</h2>
          
          <input type="text" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} style={{ display: "block", margin: "10px 0", padding: "5px", width: "80%" }} />
          
          <input type="text" placeholder="Product Name" value={productName} onChange={(e) => setProductName(e.target.value)} style={{ display: "block", margin: "10px 0", padding: "5px", width: "80%" }} />
          
          <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} style={{ display: "block", margin: "10px 0", padding: "5px", width: "80%" }} />
          
          <input type="number" placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} style={{ display: "block", margin: "10px 0", padding: "5px", width: "80%" }} />
          
          <button onClick={handleAddProduct} style={{ marginTop: "10px", padding: "10px 20px", backgroundColor: "#0070f3", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>Add</button>
        
        </div>

        {/* Right Panel */}
        <div style={{ flex: 1, padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h3>Product List</h3>
            <p>{today}</p>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Category</th>
                <th>Name</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{p.category}</td>
                  <td>{p.productName}</td>
                  <td>${p.price.toFixed(2)}</td>
                  <td>{p.quantity}</td>
                  <td>${(p.price * p.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: "20px" }}>
            <button onClick={handleSaveBill} style={{ marginRight: "10px", padding: "10px 15px", backgroundColor: "green", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>Save Bill PDF</button>

            <button onClick={() => alert("Send Bill via Email")} style={{ padding: "10px 15px", backgroundColor: "#0070f3", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>Send Bill Mail</button>
          </div>
        </div>
      </div>
    );
  }
