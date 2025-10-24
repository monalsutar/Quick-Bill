"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import "./stock.css";

export default function StockPageContent() {
  const [stockItems, setStockItems] = useState([]);
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [quantityAvailable, setQuantityAvailable] = useState("");
  const [editingId, setEditingId] = useState(null); // Track row being edited

  // Fetch all stock items
  const fetchStock = async () => {
    try {
      const res = await axios.get("/api/stock");
      setStockItems(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  // Add new stock
  const handleAddStock = async () => {
    if (!productName || !category || !price || !quantityAvailable) return;

    try {
      await axios.post("/api/stock", {
        productName,
        category,
        price: parseFloat(price),
        quantityAvailable: parseInt(quantityAvailable),
      });

      clearForm();
      fetchStock();
    } catch (error) {
      console.error(error);
    }
  };

  // Update existing stock
  const handleUpdateStock = async () => {
    if (!editingId) return; // safety check

    try {
      await axios.put("/api/stock", {
        id: editingId,
        productName,
        category,
        price: parseFloat(price),
        quantityAvailable: parseInt(quantityAvailable),
      });

      clearForm();
      fetchStock();
    } catch (error) {
      console.error(error);
    }
  };

  // Load row into form for editing
  const handleEditRow = (item) => {
    setEditingId(item._id);
    setProductName(item.productName);
    setCategory(item.category);
    setPrice(item.price);
    setQuantityAvailable(item.quantityAvailable);
  };

  // Delete stock
  const handleDeleteStock = async (id) => {
    try {
      await axios.delete("/api/stock", { data: { id } });
      fetchStock();
      if (editingId === id) clearForm(); // clear form if deleting edited row
    } catch (error) {
      console.error(error);
    }
  };

  // Clear form
  const clearForm = () => {
    setProductName("");
    setCategory("");
    setPrice("");
    setQuantityAvailable("");
    setEditingId(null);
  };

  return (
    <div className="stock-container">
      <h2>Manage Stock</h2>

      <div className="stock-form">
        <input
          type="text"
          placeholder="Product Name"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
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
            <button onClick={handleUpdateStock}>Update Product</button>
            <button onClick={clearForm} style={{ backgroundColor: "#888" }}>
              Cancel
            </button>
          </>
        ) : (
          <button onClick={handleAddStock}>Add Product</button>
        )}
      </div>

      <table className="stock-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {stockItems.map((item) => (
            <tr key={item._id} onClick={() => handleEditRow(item)}>
              <td>{item.productName}</td>
              <td>{item.category}</td>
              <td>₹{item.price.toFixed(2)}</td>
              <td>{item.quantityAvailable}</td>
              <td>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteStock(item._id); }}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
