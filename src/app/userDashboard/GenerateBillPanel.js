"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import "./userDashboard.css";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ToastContainer, toast } from 'react-toastify';


export default function GenerateBillPanel() {
    const router = useRouter();
    const { data: session } = useSession();

    const [categories, setCategories] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [bills, setBills] = useState([]);
    const [selectedBill, setSelectedBill] = useState(null);
    const [viewBill, setViewBill] = useState(null);
    const [merchant, setMerchant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const billsPerPage = 10;

    const [products, setProducts] = useState([
        { category: "", productName: "", price: "", quantity: 1 },
    ]);

    // const { data: session, status } = useSession();
    const [active, setActive] = useState("dashboard");

    const nav = (view) => {
        setActive(view);
        setActiveView(view);
    };

    // Fetch merchant once on mount
    // useEffect(() => {
    //     if (session?.user?.email) {
    //         axios
    //             .get(`/api/users?email=${session.user.email}`)
    //             .then((res) => setMerchant(res.data))
    //             .catch((err) => console.error("Error fetching merchant:", err));
    //     }
    // }, [session]);

    // Fetch categories and bills
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
                    (a, b) =>
                        new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
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

    // Fetch suggestions when category changes
    const fetchSuggestions = async (category) => {
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

    const updateProductField = (index, field, value) => {
        const updated = [...products];
        updated[index][field] = value;
        setProducts(updated);

        if (field === "category") fetchSuggestions(value);
    };

    // Autofill price when product changes
    useEffect(() => {
        const autoFillPrices = async () => {
            try {
                const res = await axios.get("/api/stock");
                const stock = res.data;
                setProducts((prev) =>
                    prev.map((p) => {
                        const item = stock.find(
                            (it) =>
                                it.productName === p.productName && it.category === p.category
                        );
                        return item ? { ...p, price: item.price } : p;
                    })
                );
            } catch (err) {
                console.error(err);
            }
        };
        autoFillPrices();
    }, [products.map((p) => p.productName).join(",")]);

    const handleAddProductRow = () => {
        setProducts([...products, { category: "", productName: "", price: "", quantity: 1 }]);
    };

    const handleRemoveProductRow = (index) => {
        setProducts(products.filter((_, i) => i !== index));
    };

    const handleAddBill = async (e) => {
        e.preventDefault();
        if (products.some((p) => !p.category || !p.productName || !p.price || !p.quantity))
            return toast.error("Please fill all product fields.");

        // 👇 Add this before newBill
        const total = products.reduce(
            (acc, p) => acc + Number(p.price) * Number(p.quantity),
            0
        );

        const newBill = {
            customerName: "Walk-in Customer",

            items: products.map((p) => ({
                productName: p.productName,
                category: p.category,
                price: Number(p.price),
                quantity: Number(p.quantity),
                totalAmount: Number(p.price) * Number(p.quantity),
            })),

            totalAmount: total,   // ⭐ ADD THIS LINE ⭐

            merchant: {
                name: merchant?.name,
                email: merchant?.email,
            },

            date: new Date(),
            createdAt: new Date(),
        };


        try {
            const res = await axios.post("/api/bills", newBill);

            const savedBill = res.data.bill;   // ⭐ IMPORTANT

            setBills((prev) => [savedBill, ...prev]);   // ⭐ adds correct bill with _id

            setProducts([{ category: "", productName: "", price: "", quantity: 1 }]);
            toast.success("Bill Added Successfully ✅");

        } catch (err) {
            console.error(err);
            toast.error("Error adding bill");
        }
    };


    // Pagination
    const indexOfLastBill = currentPage * billsPerPage;
    const indexOfFirstBill = indexOfLastBill - billsPerPage;
    const currentBills = bills.slice(indexOfFirstBill, indexOfLastBill);
    const totalPages = Math.ceil(bills.length / billsPerPage);
    const handleNextPage = () =>
        currentPage < totalPages && setCurrentPage(currentPage + 1);
    const handlePrevPage = () =>
        currentPage > 1 && setCurrentPage(currentPage - 1);

    const handleDelete = async (bill) => {
        if (!confirm("Delete this bill?")) return;
        try {
            await axios.delete(`/api/bills`, { data: { id: bill._id } });
            setBills((prev) => prev.filter((b) => b._id !== bill._id));
            setSelectedBill(null);
        } catch (err) {
            console.error(err);
            toast.error("Delete failed");
        }
    };

    // View Bill Popup
    const handleViewBill = async (billId) => {
        try {
            const res = await axios.get(`/api/bills?id=${billId}`);
            if (res.data.success) {
                setViewBill(res.data.bill);
            } else {
                toast.info("Bill not found!");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error fetching bill!");
        }
    };

    if (loading) return <p>Loading...</p>;

    return (
        <div>
            <ToastContainer />
            <h3>🧾 Generate Bill</h3>

            {/* Add Bill Form */}
            <form className="generate-bill-form" onSubmit={handleAddBill}>
                <p className="form-subtitle">Fill product details to create a new bill entry</p>

                {products.map((p, index) => (
                    <div key={index} className="form-grid">
                        <div className="form-group">
                            <label>Category</label>
                            <select
                                value={p.category}
                                onChange={(e) => updateProductField(index, "category", e.target.value)}
                            >
                                <option value="">Select Category</option>
                                {categories.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Product Name</label>
                            <input
                                list="prod-suggestions"
                                placeholder="Type or choose..."
                                value={p.productName}
                                onChange={(e) => updateProductField(index, "productName", e.target.value)}
                            />
                            <datalist id="prod-suggestions">
                                {suggestions.map((s) => (<option key={s} value={s} />))}
                            </datalist>
                        </div>

                        <div className="form-group">
                            <label>Price (₹)</label>
                            <input
                                type="number"
                                placeholder="Enter Price"
                                value={p.price}
                                onChange={(e) => updateProductField(index, "price", e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>Quantity</label>
                            <input
                                type="number"
                                min="1"
                                placeholder="Qty"
                                value={p.quantity}
                                onChange={(e) => updateProductField(index, "quantity", e.target.value)}
                            />
                        </div>

                        <div className="form-group remove-btn-wrapper">
                            {products.length > 1 && (
                                <button type="button" className="remove-btn" onClick={() => handleRemoveProductRow(index)}>
                                    ❌ Remove
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                <div className="form-actions">
                    <button type="button" onClick={handleAddProductRow} className="add-product-btn">➕ Add Another Product</button>
                    <button type="submit" className="submit-btn">✅ Generate Bill</button>
                </div>
            </form>

            {/* Bills Table */}
            <div className="bill-table-header">
                <h4>Recent Bills</h4>
                <div className="bill-actions">
                    <button
                        className="view-bill-btn"
                        disabled={!selectedBill}
                        onClick={() => selectedBill && handleViewBill(selectedBill._id)}
                    >
                        👁 View
                    </button>
                    <button
                        className="delete-bill-btn"
                        disabled={!selectedBill}
                        onClick={() => handleDelete(selectedBill)}
                    >
                        🗑 Delete
                    </button>
                </div>

                <div className="pagination-controls">
                    <button onClick={handlePrevPage} disabled={currentPage === 1}>⬅ Prev</button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button onClick={handleNextPage} disabled={currentPage === totalPages}>Next ➡</button>
                </div>

            </div>

            <br></br>

            <table className="bill-product-table">
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
                        <tr><td colSpan="4" style={{ textAlign: "center" }}>No bills found</td></tr>
                    ) : (
                        currentBills.map((b, i) => {
                            const total = b.items?.reduce((acc, item) => acc + Number(item.totalAmount || item.price * item.quantity || 0), 0) || 0;
                            return (
                                <tr
                                    key={b._id || i}
                                    onClick={() => setSelectedBill(selectedBill?._id === b._id ? null : b)}
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

            {/* Bill Popup Modal */}
            {viewBill && (
                <div className="modal-backdrop" onClick={() => setViewBill(null)}>
                    <div className="billdisplay-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="close-modal-btn" onClick={() => setViewBill(null)}>✖</button>

                        <div className="invoice-container">
                            {/* ===== Invoice Header ===== */}
                            <div className="invoice-header">
                                <div className="invoice-logo">
                                    <img src="../logo4.png" alt="Logo" />
                                </div>
                                <div className="invoice-company">
                                    <h2>Quick Bill Application</h2>
                                    <p>Mobile: +91 9874102365 | Email: quickbill@gmail.com</p>
                                    <p>GSTIN: 29AAAAA1234F### | PAN: 29AAAAA1234F</p>
                                </div>
                            </div>

                            {/* ===== Invoice Meta ===== */}
                            <div className="invoice-meta">
                                <table>
                                    <tbody>
                                        <tr>
                                            <td><b>Invoice No:</b></td>
                                            <td>QB/{viewBill._id}</td>
                                            <td><b>Date:</b></td>
                                            <td>{new Date(viewBill.date).toLocaleDateString()}</td>
                                        </tr>
                                        <tr>
                                            <td><b>Place of Supply:</b></td>
                                            <td>Maharashtra</td>
                                            <td><b>Reverse Charge:</b></td>
                                            <td>No</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* ===== Billing & Shipping Info ===== */}
                            <div className="billing-shipping">
                                <div className="billing">
                                    <h4>Billing (Merchant) Details</h4>
                                    <p><b>{merchant?.name || session?.user?.name}</b></p>
                                    <p>{merchant?.shopName || "QuickBill Shop"}</p>
                                    {/* <p>{merchant?.phone || "Your Phone"}</p> */}
                                    <p>{merchant?.email || session?.user?.email}</p>
                                    {/* <p>GSTIN: {merchant?.gstin || "Your GSTIN"}</p> */}
                                    {/* <p>PAN: {merchant?.pan || "Your PAN"}</p> */}
                                </div>
                                <div className="shipping">
                                    <h4>Shipping (Customer) Details</h4>
                                    <p><b>{viewBill.customerName}</b></p>
                                </div>
                            </div>

                            {/* ===== Items Table ===== */}
                            <table className="items-table">
                                <thead>
                                    <tr>
                                        <th>Sr</th>
                                        <th>Item</th>
                                        <th>Qty</th>
                                        <th>Unit</th>
                                        <th>Rate</th>
                                        <th>Tax %</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {viewBill.items.map((item, i) => (
                                        <tr key={i}>
                                            <td>{i + 1}</td>
                                            <td>{item.productName}</td>
                                            <td>{item.quantity}</td>
                                            <td>{item.productName.toLowerCase().includes("milk") ? "ltr" : "pcs"}</td>
                                            <td>₹{item.price.toFixed(2)}</td>
                                            <td>{item.gstRate || 0}%</td>
                                            <td>₹{(item.totalAmount || item.price * item.quantity).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* ===== Invoice Summary ===== */}
                            <div className="invoice-summary">
                                <table>
                                    <tbody>
                                        <tr>
                                            <td><b>Subtotal:</b></td>
                                            <td>₹{viewBill.items.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td><b>Total Tax:</b></td>
                                            <td>₹{viewBill.items.reduce((sum, i) => sum + (i.taxAmount || 0), 0).toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td><b>Total Amount:</b></td>
                                            <td>₹{(viewBill.totalAmount ??
                                                viewBill.items.reduce((sum, i) => sum + (i.totalAmount || i.price * i.quantity), 0)
                                            ).toFixed(2)}</td>


                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <p style={{ textAlign: "center", marginTop: "10px", fontStyle: "italic" }}>
                                Thank you for your business!
                            </p>

                            <div className="invoice-footer">
                                <div className="terms">
                                    <h4>Terms & Conditions</h4>
                                    <p>1. Goods once sold will not be taken back.</p>
                                    <p>2. Subject to local jurisdiction only.</p>
                                </div>

                                <div className="signature">
                                    <p>For Quick Bill Application</p>
                                    <br />
                                    <p>Authorized Signature</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
