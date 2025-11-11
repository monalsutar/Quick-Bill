"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import "./userDashboard.css";

export default function StockReportUser() {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10; // ✅ show 10 items per page

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const res = await axios.get("/api/stock");
        const data = res.data || [];
        setStock(data);

        // Extract unique categories
        const uniqueCats = [...new Set(data.map((item) => item.category))];
        setCategories(uniqueCats);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStock();
  }, []);

  // Reset to first page when switching categories
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);


  if (loading) return <p>Loading stock...</p>;

  const lowStock = stock.filter((s) => (s.quantityAvailable ?? 0) <= 10);

  // Filtered items for selected category
  const filteredProducts = selectedCategory
    ? stock
      .filter((s) => s.category === selectedCategory)
      .sort((a, b) => a.productName.localeCompare(b.productName))
    : [];

  // ✅ Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirst, indexOfLast);

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };


  return (
    <div>
      <h3>📦 Stock Report</h3><br></br>

      {/* --- Summary Cards --- */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 15, marginBottom: 20 }}>
        <div className="card blue" style={{ padding: 12, flex: "1 1 200px" }}>
          <h4>Total Items</h4>
          <p>{stock.length}</p>
        </div>
        <div className="card yellow" style={{ padding: 12, flex: "1 1 200px" }}>
          <h4>Low Stock</h4>
          <p>{lowStock.length}</p>
        </div>
        <div className="card green" style={{ padding: 12, flex: "1 1 200px" }}>
          <h4>Total Categories</h4>
          <p>{categories.length}</p>
        </div>
      </div>

      {/* --- Category Cards --- */}
      <h4>🗃️ Categories</h4>
      <div className="category-grid">
        {categories.map((cat) => {
          const count = stock.filter((p) => p.category === cat).length;
          const low = stock.filter(
            (p) => p.category === cat && (p.quantityAvailable ?? 0) <= 10
          ).length;

          return (
            <div
              key={cat}
              className={`category-card ${selectedCategory === cat ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat === selectedCategory ? "" : cat)}
            >
              <h5>{cat}</h5>
              <p>{count} items</p>
              {low > 0 && <small className="low-stock">{low} low stock</small>}
            </div>
          );
        })}
      </div>

      {/* --- Products Table --- */}
      {selectedCategory && (
        <div className="stock-report-container" style={{ marginTop: 25 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <h4>📂 Products in “{selectedCategory}”</h4>
            <button onClick={() => setSelectedCategory("")}>Back to Categories</button>
          </div>

          {/* ✅ Pagination Controls */}
          {filteredProducts.length > rowsPerPage && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                margin: "15px 0",
                gap: "15px",
              }}
            >
              <button onClick={handlePrev} disabled={currentPage === 1}>
                ⬅️ Prev
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button onClick={handleNext} disabled={currentPage === totalPages}>
                Next ➡️
              </button>
            </div>
          )}

          <table className="product-table" style={{ marginTop: 10 }}>
            <thead className="stock-table-head">
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Available</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {currentProducts.map((p, i) => (
                <tr
                  key={p._id}
                  className={p.quantityAvailable <= 10 ? "low-stock-row" : ""}
                >
                  <td>{indexOfFirst + i + 1}</td>
                  <td>{p.productName}</td>
                  <td className={p.quantityAvailable <= 10 ? "low-stock" : ""}>
                    {p.quantityAvailable}
                  </td>
                  <td>₹{(p.price || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
