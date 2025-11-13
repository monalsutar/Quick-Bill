"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import axios from "axios";

import { saveBillOffline, syncOfflineData, getOfflineStock, saveStockOffline } from "../utils/offlineHelper";
import generateBillPDF from "../utils/generateBillPDF";
import printBill from "../utils/printBill";
import "./proceed.css";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default function ProceedPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const customerId = searchParams.get("customerId");

  const [customer, setCustomer] = useState(null);
  const [products, setProducts] = useState([]);
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [categories, setCategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const printRef = useRef();
  const [discount, setDiscount] = useState("");
  const [unit, setUnit] = useState("Pcs");


  const today = new Date().toLocaleDateString("en-GB");

  const gstRates = {
    "Milk": 5, "Cream": 5, "Curd": 5, "Butter": 12, "Ghee": 12, "Cheese": 12, "Honey": 5, "Egg": 5, "Paneer": 5,
    "Rice": 5, "Wheat": 5, "Flour": 5, "Cereals": 5, "Pulses": 5, "Atta": 5, "Suji": 5,
    "Snacks": 12, "Sweets": 5, "Chocolate": 18, "Soft Drinks": 28, "Fruit Juice": 12, "Packaged Water": 12,
    "Tea": 5, "Coffee": 5, "Biscuit": 12, "Bread": 5,
    "Toothpaste": 18, "Soap": 18, "Shampoo": 18, "Cosmetics": 18, "Perfume": 18, "Deodorant": 18,
    "Pen": 12, "Notebook": 12, "Paper": 12, "Printer": 18, "Ink": 18,
    "Others": 12,
  };

  // Fetch customer
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const res = await axios.get("/api/customers");
        const cust = res.data.find(c => c._id === customerId);

        if (cust) {
          // Customer already exists → Regular
          setCustomer({ ...cust, isNew: false });
        } else {
          // Just added recently (not found in DB)
          const newCust = {
            name: searchParams.get("name"),
            email: searchParams.get("email"),
            phone: searchParams.get("phone"),
            address: searchParams.get("address"),
            createdAt: new Date(),
            isNew: true,
          };
          setCustomer(newCust);
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (customerId) fetchCustomer();
  }, [customerId]);

  // Autofill products from URL
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

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        let stockData;
        if (!navigator.onLine) {
          stockData = await getOfflineStock();
        } else {
          const res = await axios.get("/api/stock");
          stockData = res.data;
          await saveStockOffline(stockData);
        }
        const uniqueCategories = [...new Set(stockData.map(i => i.category))];
        setCategories(uniqueCategories);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

  // Filter products by category
  useEffect(() => {
    const fetchFilteredProducts = async () => {
      try {
        const res = await axios.get("/api/stock");
        const productsForCategory = res.data
          .filter(item => item.category === category)
          .map(item => item.productName);
        setFilteredProducts(productsForCategory);
      } catch (err) {
        console.error(err);
      }
    };
    if (category) fetchFilteredProducts();
  }, [category]);

  // Autofill price
  useEffect(() => {
    const fetchPrice = async () => {
      if (!productName) return;
      try {
        const res = await axios.get("/api/stock");
        const stockItem = res.data.find(s => s.productName === productName && s.category === category);
        if (stockItem) setPrice(stockItem.price);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPrice();
  }, [productName, category]);

  useEffect(() => {
    window.addEventListener("online", syncOfflineData);
    return () => window.removeEventListener("online", syncOfflineData);
  }, []);

  if (!customer) return <p className="loading">Loading customer data...</p>;

  const toggleRowSelection = (index) => {
    setSelectedRows(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedRows.length === 0) return;
    if (!confirm(`Delete ${selectedRows.length} product(s)?`)) return;
    setProducts(products.filter((_, i) => !selectedRows.includes(i)));
    setSelectedRows([]);
  };

  const handleAddProduct = async () => {
    if (!productName || !category || !quantity) return;
    const qty = parseInt(quantity);
    if (!qty || qty < 1) return alert("Quantity must be at least 1.");

    try {
      let stockData = navigator.onLine ? (await axios.get("/api/stock")).data : await getOfflineStock();
      const stockItem = stockData.find(s => s.productName === productName && s.category === category);
      if (!stockItem) return alert("Product not found in stock!");
      if (stockItem.quantityAvailable < qty) return alert(`Only ${stockItem.quantityAvailable} units available!`);

      const priceValue = stockItem.price;
      const gstRate = gstRates[productName] || 12;
      const discountValue = discount ? parseFloat(discount) : 0;
      const discountedPrice = priceValue - (priceValue * discountValue / 100);
      const totalWithGST = discountedPrice * qty;
      const taxAmount = (totalWithGST * gstRate) / (100 + gstRate);

      setProducts(prev => [
        ...prev,
        {
          productName,
          category,
          unit,
          discount: discountValue,
          price: priceValue,
          quantity: qty,
          gstRate,
          taxAmount,
          totalWithGST
        }
      ]);

      if (navigator.onLine) await axios.post("/api/updateStock", { productName, quantitySold: qty });

      setProductName("");
      setCategory("");
      setPrice("");
      setQuantity("");
      setDiscount("");
      setUnit("");
    } catch (err) {
      console.error(err);
      alert("Error adding product!");
    }
  };


  const handleGenerateBill = async () => {
    if (!customer || !products.length) return alert("Add customer and at least one product.");
    const billData = { customer, products, paymentMode, date: today, merchant: session?.user || {} };
    if (!navigator.onLine) {
      await saveBillOffline(billData);
      alert("🧾 Bill saved offline. It will sync later.");
      router.push(`/billdisplay?data=${encodeURIComponent(JSON.stringify(billData))}`);
      return;
    }
    try {
      await axios.post("/api/bills", { customerName: customer.name, items: products, totalAmount: products.reduce((a, p) => a + p.price * p.quantity, 0), date: new Date().toISOString() });
      router.push(`/billdisplay?data=${encodeURIComponent(JSON.stringify(billData))}`);
    } catch (err) { console.error(err); alert("Failed to save bill."); }
  };

  const handleBack = () => router.push("/userDashboard");

  const showPaymentButton = paymentMode === "UPI" || paymentMode === "Card";

  return (
    <div className="proceed-page-saas">


      {/* Topbar */}
      <header className="topbar">
        <div className="topbar-left">
          <img src="/logo4.png" alt="QuickBill Logo" className="logo-img" />
        </div>

        <button className="back-btn" onClick={() => router.push("/userDashboard")}>
          ← <span>Back to Dashboard</span>
        </button>

        <div className="topbar-right">
          <div className="user-info">
            <span className="user-name">{session?.user?.name || "User"}</span>
            <span className="user-role">{session?.user?.email || "user@gmail.com"}</span>
          </div>
          <img
            src={session?.user?.image || "/defaultProfile.png"}
            alt="User"
            className="user-avatar"
          />
        </div>
      </header>


      {/* Main Container */}
      <div className="main-saas-container">

        {/* === Customer + Product Form === */}
        <div className="top-section">


          {/* --- Customer Details Card --- */}
          <div className="product-customer-card">
            <h2>Customer Details</h2>
            <div className="product-customer-info">
              <p><span>Name:</span> <strong>{customer?.name || "N/A"}</strong></p>
              <p><span>Email:</span> <strong>{customer?.email || "N/A"}</strong></p>
              <p><span>Contact:</span> <strong>{customer?.phone || "N/A"}</strong></p>
              <p><span>Address:</span> <strong>{customer?.address || "N/A"}</strong></p>
            </div>

            <div className="product-customer-card-footer">
              <p className="product-customer-card-footer-date">

                <span>Joined: {customer?.createdAt ? new Date(customer.createdAt).toLocaleDateString("en-GB") : today}</span>
              </p>
              <p className="product-customer-card-footer-type">
                <span>{customer?.isNew ? "New Customer" : "Regular Customer"}</span>
              </p>
            </div>
          </div>



          {/* --- Product Form Card --- */}
          {/* --- Enhanced Product Form Card --- */}

          {/* --- Product Details Form Card --- */}
          <div className="product-details-card">

            {/* Right Side Form Section */}
            <div className="product-details-right">
              <div className="product-details-header">
                <h2>Add Product Details</h2>
                <p>Let’s grow your collection — add your amazing products here ✨</p>
              </div>

              <form className="product-details-form">

                <div className="product-details-input-row">
                  {/* Category */}
                  <div className="product-details-input">
                    <label>🏷️Category*</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                    >
                      <option value="">Select Category</option>
                      {categories.map((c, i) => (
                        <option key={i} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Product */}
                  <div className="product-details-input">
                    <label>🛍️Product*</label>
                    <div className="product-details-product-row">
                      <select
                        value={productName}
                        onChange={e => setProductName(e.target.value)}
                        disabled={!category}
                      >
                        <option value="">Select Product</option>
                        {filteredProducts.map((p, i) => (
                          <option key={i} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>


                {price && <span className="product-details-price">Price : ₹{price}</span>}

                <div className="product-details-input-row">
                  {/* Quantity */}
                  <div className="product-details-input-qty">
                    <label>📦Quantity*</label>
                    <input
                      type="number"
                      placeholder="Enter Quantity"
                      value={quantity}
                      onChange={e => setQuantity(e.target.value)}
                    />
                  </div>

                  {/* Unit */}
                  <div className="product-details-input">
                    <label>⚖️Unit*</label>
                    <select onChange={e => setUnit(e.target.value)}>
                      <option>Pcs</option>
                      <option>Kg</option>
                      <option>Litre</option>
                      <option>Packet</option>
                    </select>
                  </div>
                </div>


                {/* Discount */}
                <div className="product-details-input-qty">
                  <label>💸Discount</label>
                  <input
                    type="number"
                    placeholder="Enter discount (if any)"
                    value={discount}
                    onChange={e => setDiscount(e.target.value)}
                  />
                </div>

                <p className="form-hint">💡 Tip: You can add multiple products before generating the bill.</p>

                {/* Add Button */}
                <button
                  type="button"
                  className="product-details-btn"
                  onClick={handleAddProduct}
                >
                  ➕ Add Product 🛒
                </button>
              </form>
            </div>

          </div>
        </div>

        {/* === Product Table === */}
        {/* === Product Table === */}
        <div className="table-section">

          <div className="cart-banner">
            <span className="cart-icon">🛍️</span>
            <p>Here’s your purchase summary — the items you’ve selected just for your Customer</p>
          </div>


          <div class="table-responsive">

            <table className="product-table">
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
                {products.length > 0 ? (
                  products.map((p, i) => (
                    <tr
                      key={i}
                      className={selectedRows.includes(i) ? "selected-row" : ""}
                      onClick={() => toggleRowSelection(i)}
                    >
                      <td>{i + 1}</td>
                      <td>{p.category}</td>
                      <td>{p.productName}</td>
                      <td>{p.unit || "-"}</td>
                      <td>{p.discount ? `${p.discount}%` : "0%"}</td>
                      <td>₹{p.price.toFixed(2)}</td>
                      <td>{p.quantity}</td>
                      <td>{p.gstRate}%</td>
                      <td>₹{p.taxAmount.toFixed(2)}</td>
                      <td>₹{p.totalWithGST.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="10">No products added</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>


        {/* === Payment + Actions === */}
        <div className="bottom-section">

          <div className="payment-options">
            <h3>Select Payment Mode</h3>
            <div>
              <label>
                <input type="radio" name="payment" value="Cash" checked={paymentMode === "Cash"} onChange={e => setPaymentMode(e.target.value)} />
                <span>Cash</span>
              </label>
              <label>
                <input type="radio" name="payment" value="Card" checked={paymentMode === "Card"} onChange={e => setPaymentMode(e.target.value)} />
                <span>Card</span>
              </label>
              <label>
                <input type="radio" name="payment" value="Online" checked={paymentMode === "Online"} onChange={e => setPaymentMode(e.target.value)} />
                <span>Online</span>
              </label>
            </div>

          </div>



          <div className="action-buttons">
            {selectedRows.length > 0 && (
              <button className="remove-btn" onClick={handleDeleteSelected}>
                🗑 Delete Selected ({selectedRows.length})
              </button>
            )}
            <button className="generate-btn" onClick={handleGenerateBill}>🧾 Generate Bill</button>
          </div>
        </div>

      </div>
    </div>
  );
}
