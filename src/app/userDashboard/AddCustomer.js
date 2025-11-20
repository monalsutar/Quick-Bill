"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import "./addCustomer.css";
import { useRouter } from "next/navigation"; // ✅ import useRouter
import { ToastContainer, toast } from 'react-toastify';


export default function AddCustomer() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedRow, setSelectedRow] = useState(null);
    const [showPanel, setShowPanel] = useState(false);
    const [page, setPage] = useState(1);
    const router = useRouter(); // ✅ get the router instance


    // New customer form data
    const [newCustomer, setNewCustomer] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
    });

    // Fetch customers
    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const res = await axios.get("/api/customers");
            setCustomers(res.data.reverse());
        } catch (err) {
            toast.error("Error fetching customers:", err);
        } finally {
            setLoading(false);
        }
    };

    // Filter & paginate
    const filtered = customers.filter(
        (c) =>
            c.name?.toLowerCase().includes(search.toLowerCase()) ||
            c.email?.toLowerCase().includes(search.toLowerCase()) ||
            c.phone?.includes(search)
    );

    const customersPerPage = 10;
    const totalPages = Math.ceil(filtered.length / customersPerPage);
    const startIndex = (page - 1) * customersPerPage;
    const paginated = filtered.slice(startIndex, startIndex + customersPerPage);

    // Delete customer
    const handleDelete = async () => {
        if (!selectedRow) return toast("Select a customer to delete first.");
        if (!confirm(`Delete ${selectedRow.name}?`)) return;
        try {
            await axios.delete(`/api/customers/${selectedRow._id}`);
            toast.success("Customer deleted successfully!");
            setSelectedRow(null);
            fetchCustomers();
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete customer!");
        }
    };

    // Add new customer
    const handleAddCustomer = async (e) => {
        e.preventDefault();
        if (!newCustomer.name || !newCustomer.phone) {
            toast("Please fill required fields (name and phone).");
            return;
        }
        try {
            const res = await axios.post("/api/customers", newCustomer);
            if (res.status === 201 || res.data) {
                toast.success("Customer added successfully!");
                setShowPanel(false);
                setNewCustomer({ name: "", email: "", phone: "", address: "" });
                fetchCustomers();
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to add customer!");
        }
    };

    return (
        <>
            <ToastContainer />
            <div className="add-customer-container">
                <div className="header-section">
                    <h2>🤝 Customer Management 🤝</h2>
                    <p>Manage, search, and add customers effortlessly.</p>
                </div>

                {/* Top Controls */}
                <div className="customer-actions">
                    <input
                        type="text"
                        placeholder="🔍 Search customers..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <div className="action-buttons">
                        <button className="add-btn" onClick={() => { setShowPanel("addCustomer") }}>
                            ➕ Add Customer
                        </button>

                        {selectedRow && (
                            <button className="delete-btn" onClick={handleDelete}>
                                ❌ Delete
                            </button>
                        )}
                    </div>
                </div>


                {/* Customer Table */}
                {loading ? (
                    <p className="loading">Loading customers...</p>
                ) : filtered.length === 0 ? (
                    <p className="no-data">No customers found.</p>
                ) : (
                    <>
                        <div className="table-wrapper">
                            <table className="customer-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Customer Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Address</th>
                                        <th>Date Added</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.map((cust, i) => (
                                        <tr
                                            key={cust._id}
                                            className={selectedRow?._id === cust._id ? "selected-row" : ""}
                                            onClick={() =>
                                                setSelectedRow(selectedRow?._id === cust._id ? null : cust)
                                            }
                                        >
                                            <td>{startIndex + i + 1}</td>
                                            <td>{cust.name}</td>
                                            <td>{cust.email || "-"}</td>
                                            <td>{cust.phone}</td>
                                            <td>{cust.address || "-"}</td>
                                            <td>{new Date(cust.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="pagination">
                            <button disabled={page === 1} onClick={() => setPage(page - 1)}>
                                ⬅ Prev
                            </button>
                            <span>
                                Page {page} / {totalPages}
                            </span>
                            <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                                Next ➡
                            </button>
                        </div>
                    </>
                )}

                {/* Slide-in Add Customer Panel */}
                <div className={`side-panel ${showPanel ? "open" : ""}`}>


                    <div className="side-panel-header">
                        <h3>➕ Add New Customer</h3>
                        <button className="close-btn" onClick={() => setShowPanel(false)}>
                            ✖
                        </button>
                    </div>


                    <form onSubmit={handleAddCustomer} className="side-panel-form">
                        <input
                            type="text"
                            placeholder="Customer Name *"
                            value={newCustomer.name}
                            onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            value={newCustomer.email}
                            onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="Phone *"
                            value={newCustomer.phone}
                            onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                        />
                        <textarea
                            placeholder="Address"
                            value={newCustomer.address}
                            onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                        ></textarea>

                        <button type="submit" className="save-btn">
                            💾 Save Customer
                        </button>
                    </form>
                </div>

                {/* Background overlay for panel */}
                {showPanel && <div className="overlay" onClick={() => setShowPanel(false)}></div>}
            </div>
        </>
    );
}
