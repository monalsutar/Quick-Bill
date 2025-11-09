"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import "./userDashboard.css";

export default function GenerateBillPanel() {
    const [categories, setCategories] = useState([]);
    const [category, setCategory] = useState("");
    const [productName, setProductName] = useState("");
    const [price, setPrice] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [suggestions, setSuggestions] = useState([]);
    const [bills, setBills] = useState([]);
    const [selectedBill, setSelectedBill] = useState(null);
    const [viewBill, setViewBill] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    const billsPerPage = 10;

    // ✅ Fetch categories + bills
    useEffect(() => {
        const fetchData = async () => {
            try {
                const stockRes = await axios.get("/api/stock");
                const cats = [...new Set(stockRes.data.map((i) => i.category))];
                setCategories(cats);

                const billRes = await axios.get("/api/bills");
                const allBills = Array.isArray(billRes.data)
                    ? billRes.data
                    : billRes.data?.bills || [];
                const sorted = allBills.sort(
                    (a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
                );
                setBills(sorted);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // ✅ Suggestions for product names
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!category) return setSuggestions([]);
            try {
                const res = await axios.get("/api/stock");
                const list = res.data
                    .filter((s) => s.category === category)
                    .map((s) => s.productName);
                setSuggestions(list);
            } catch (err) {
                console.error(err);
            }
        };
        fetchSuggestions();
    }, [category]);

    // ✅ Auto-fill price when product selected
    useEffect(() => {
        const autoFillPrice = async () => {
            if (!productName || !category) return;
            try {
                const res = await axios.get("/api/stock");
                const item = res.data.find(
                    (it) => it.productName === productName && it.category === category
                );
                if (item) setPrice(item.price);
            } catch (err) {
                console.error(err);
            }
        };
        autoFillPrice();
    }, [productName, category]);

    // ✅ Add Bill to DB
    const handleAddBill = async (e) => {
        e.preventDefault();
        if (!productName || !category || !price || !quantity)
            return alert("Please fill all fields");

        const newBill = {
            customerName: "Walk-in Customer",
            items: [
                {
                    productName,
                    category,
                    price: Number(price),
                    quantity: Number(quantity),
                    totalAmount: Number(price) * Number(quantity),
                },
            ],
            date: new Date(),
            createdAt: new Date(),
        };

        try {
            await axios.post("/api/bills", newBill);
            setBills((prev) => [newBill, ...prev]);
            setProductName("");
            setCategory("");
            setPrice("");
            setQuantity(1);
            alert("Bill Added Successfully ✅");
        } catch (err) {
            console.error(err);
            alert("Error adding bill");
        }
    };

    // ✅ Pagination
    const indexOfLastBill = currentPage * billsPerPage;
    const indexOfFirstBill = indexOfLastBill - billsPerPage;
    const currentBills = bills.slice(indexOfFirstBill, indexOfLastBill);
    const totalPages = Math.ceil(bills.length / billsPerPage);

    const handleNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
    const handlePrevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

    // ✅ Delete Bill
    const handleDelete = async (bill) => {
        if (!confirm("Delete this bill?")) return;
        try {
            await axios.delete(`/api/bills`, { data: { id: bill._id } });
            setBills((prev) => prev.filter((b) => b._id !== bill._id));
            setSelectedBill(null);
        } catch (err) {
            console.error(err);
            alert("Delete failed");
        }
    };

    if (loading) return <p>Loading...</p>;

    return (
        <div>
            <h3>🧾 Generate Bill</h3>

            {/* ===== Add Bill Form ===== */}
            <form className="generate-bill-form" onSubmit={handleAddBill}>
                <div className="form-row">
                    <select value={category} onChange={(e) => setCategory(e.target.value)}>
                        <option value="">Select Category</option>
                        {categories.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>

                    <input
                        list="prod-suggestions"
                        placeholder="Product Name"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                    />
                    <datalist id="prod-suggestions">
                        {suggestions.map((s) => (
                            <option key={s} value={s} />
                        ))}
                    </datalist>

                    <input
                        type="number"
                        placeholder="Price"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                    />
                    <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                    />
                    <button type="submit">Add Bill</button>
                </div>
            </form>


            {/* ===== Table Header with Pagination ===== */}
            <div className="bill-table-header">
                <h4>Recent Bills</h4>
                {/* ===== Action Buttons ===== */}
                <div className="bill-actions">
                    <button
                        disabled={!selectedBill}
                        onClick={() => setViewBill(selectedBill)}
                    >
                        👁 View
                    </button>
                    <button
                        disabled={!selectedBill}
                        onClick={() => handleDelete(selectedBill)}
                    >
                        🗑 Delete
                    </button>
                </div>
                <div className="pagination-controls">
                    <button onClick={handlePrevPage} disabled={currentPage === 1}>
                        ⬅ Prev
                    </button>
                    <span>
                        Page {currentPage} of {totalPages}
                    </span>
                    <button onClick={handleNextPage} disabled={currentPage === totalPages}>
                        Next ➡
                    </button>
                </div>
            </div>

            {/* ===== Bills Table ===== */}
            <table className="product-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Bill Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {currentBills.length === 0 ? (
                        <tr>
                            <td colSpan="4" style={{ textAlign: "center" }}>
                                No bills found
                            </td>
                        </tr>
                    ) : (
                        currentBills.map((b, i) => {
                            const total =
                                b.items?.reduce(
                                    (acc, item) =>
                                        acc + Number(item.totalAmount || item.price * item.quantity || 0),
                                    0
                                ) || 0;
                            return (
                                <tr
                                    key={b._id || i}
                                    onClick={() => setSelectedBill(b)}
                                    className={selectedBill?._id === b._id ? "selected-row" : ""}
                                >
                                    <td>{indexOfFirstBill + i + 1}</td>
                                    <td>{b.customerName || "N/A"}</td>
                                    <td>{new Date(b.date || b.createdAt).toLocaleString()}</td>
                                    <td>₹{total.toFixed(2)}</td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>

            {/* ===== Popup Modal ===== */}
            {viewBill && (
                <div className="modal-backdrop" onClick={() => setViewBill(null)}>
                    <div className="bill-modal" onClick={(e) => e.stopPropagation()}>
                        <h4>🧾 Bill Details</h4>
                        <p>
                            <b>Customer:</b> {viewBill.customerName || "N/A"}
                        </p>
                        <p>
                            <b>Date:</b>{" "}
                            {new Date(viewBill.date || viewBill.createdAt).toLocaleString()}
                        </p>
                        <table>
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Qty</th>
                                    <th>Price</th>
                                    {/* <th>Amount</th> */}
                                </tr>
                            </thead>
                            <tbody>
                                {viewBill.items?.map((item, idx) => (
                                    <tr key={idx}>
                                        <td>{item.productName}</td>
                                        <td>{item.quantity}</td>
                                        <td>₹{item.price}</td>
                                        {/* <td>₹{item.totalAmount}</td> */}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <p style={{ textAlign: "right", fontWeight: "bold" }}>
                            Total: ₹
                            {viewBill.items
                                ?.reduce(
                                    (acc, i) =>
                                        acc +
                                        Number(i.totalAmount || i.price * i.quantity || 0),
                                    0
                                )
                                .toFixed(2)}
                        </p>
                        <button onClick={() => setViewBill(null)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}
