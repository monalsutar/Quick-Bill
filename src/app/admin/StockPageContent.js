"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import "./stock.css";

export default function StockPageContent() {
  const [stockItems, setStockItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [quantityAvailable, setQuantityAvailable] = useState("");

  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [uniqueCategories, setUniqueCategories] = useState([]);

  // Fetch all stock data
  const fetchStock = async () => {
    try {
      const res = await axios.get("/api/stock");
      setStockItems(res.data);
      const categories = [...new Set(res.data.map((i) => i.category))];
      setUniqueCategories(categories);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const handleAddOrUpdate = async () => {
    if (!productName || !category || !price || !quantityAvailable) return;
    const payload = {
      productName,
      category,
      price: parseFloat(price),
      quantityAvailable: parseInt(quantityAvailable),
    };
    try {
      if (editingId) {
        await axios.put("/api/stock", { id: editingId, ...payload });
      } else {
        await axios.post("/api/stock", payload);
      }
      clearForm();
      fetchStock();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    try {
      await axios.delete("/api/stock", { data: { id: editingId } });
      clearForm();
      fetchStock();
    } catch (error) {
      console.error(error);
    }
  };

  const clearForm = () => {
    setProductName("");
    setCategory("");
    setPrice("");
    setQuantityAvailable("");
    setEditingId(null);
  };

  const handleSelectProduct = (item) => {
    setEditingId(item._id);
    setProductName(item.productName);
    setCategory(item.category);
    setPrice(item.price);
    setQuantityAvailable(item.quantityAvailable);
  };

  // Group items by category
  const grouped = stockItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  // Filter by search term
  const filteredGrouped = Object.keys(grouped).reduce((acc, cat) => {
    const filteredItems = grouped[cat].filter((item) =>
      item.productName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filteredItems.length > 0) acc[cat] = filteredItems;
    return acc;
  }, {});

  // Filtered category suggestions
  const filteredCategories = uniqueCategories.filter((cat) =>
    cat.toLowerCase().includes(category.toLowerCase())
  );

  return (
    <div className="stock-container">
      <h2>📦 Manage Stock</h2>

      {/* 🔍 Highlighted Search Bar */}
      <input
        type="text"
        placeholder="🔍 Search product by name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="highlighted-search"
      />

      {/* 🧾 Add / Update Form */}
      {/* <p>Manage your Stock 📦</p> */}

      <div className="stock-form">

        <input
          type="text"
          placeholder="Product Name"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
        />

        <div className="category-input-wrapper">
          <input
            type="text"
            placeholder="Category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setShowCategorySuggestions(true);
            }}
            onFocus={() => setShowCategorySuggestions(true)}
            onBlur={() => setTimeout(() => setShowCategorySuggestions(false), 100)}
            className="category-input-field"
          />
          {showCategorySuggestions && category && filteredCategories.length > 0 && (
            <ul className="category-suggestions">
              {filteredCategories.slice(0, 5).map((cat, i) => (
                <li
                  key={i}
                  onMouseDown={() => {
                    setCategory(cat);
                    setShowCategorySuggestions(false);
                  }}
                >
                  {cat}
                </li>
              ))}
            </ul>
          )}
        </div>

        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <input
          type="number"
          placeholder="Quantity"
          value={quantityAvailable}
          onChange={(e) => setQuantityAvailable(e.target.value)}
        />

        {editingId ? (
          <>
            <button onClick={handleAddOrUpdate}>Update Product</button>
            <button onClick={handleDelete} style={{ backgroundColor: "#d9534f" }}>
              Delete Product
            </button>
            <button onClick={clearForm} style={{ backgroundColor: "#888" }}>
              Cancel
            </button>
          </>
        ) : (
          <button onClick={handleAddOrUpdate}>Add Product</button>
        )}
      </div>

      {/* 📊 Category-wise Listing */}

      <h2>----- Available Stock -----</h2>

      <div className="category-list">
        {Object.keys(filteredGrouped).length === 0 ? (
          <p>No products found.</p>
        ) : (
          Object.entries(filteredGrouped).map(([cat, items]) => {
            const zeroStock = items.filter((i) => i.quantityAvailable === 0).length;
            return (
              <div key={cat} className="category-section">
                <div
                  className="category-header"
                  onClick={() =>
                    setExpandedCategory(expandedCategory === cat ? null : cat)
                  }
                >
                  <h3>{cat}</h3>
                  <span>
                    {items.length} products • {zeroStock} out of stock
                  </span>
                </div>

                {expandedCategory === cat && (
                  <table className="stock-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr
                          key={item._id}
                          onClick={() => handleSelectProduct(item)}
                          style={{ cursor: "pointer" }}
                        >
                          <td style={{
                            color:item.quantityAvailable === 0 ? "red" : "black",
                            backgroundColor : item.quantityAvailable === 0 ? "pink" : "white",
                          }}>
                            {item.productName}</td>

                          <td style={{
                            color:
                              item.quantityAvailable === 0 ? "red" : "black",
                              backgroundColor : item.quantityAvailable === 0 ? "pink" : "white",
                          }}>
                            ₹{item.price.toFixed(2)}</td>

                          <td
                            style={{
                              color:
                                item.quantityAvailable === 0 ? "red" : "black",
                                backgroundColor : item.quantityAvailable === 0 ? "pink" : "white",
                            }}
                          >
                            {item.quantityAvailable}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
