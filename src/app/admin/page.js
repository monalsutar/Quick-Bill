"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { signOut, useSession } from "next-auth/react";

import StockPageContent from "./StockPageContent";
import StockReport from "./StockReport";
import "./stock.css";

import { ToastContainer, toast } from 'react-toastify';

export default function AdminPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [activeCard, setActiveCard] = useState("stocks");
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [showMenu, setShowMenu] = useState(false); // ✅ added for mobile sidebar toggle

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [name, setName] = useState(session?.user?.name || "");
  const [email, setEmail] = useState(session?.user?.email || "");
  const [password, setPassword] = useState("");

  // Fetch admin data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, custRes] = await Promise.all([
          axios.get("/api/admin/users"),
          axios.get("/api/admin/customers"),
        ]);
        setUsers(usersRes.data.users || []);
        setCustomers(custRes.data.customers || []);
      } catch (err) {
        console.error(err);
        alert("Error fetching admin data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="admin-loading">Loading Dashboard...</div>;

  const handleSaveProfile = async () => {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    if (password) formData.append("password", password);

    try {
      const res = await axios.put("/api/admin/updateProfile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        alert("Profile updated successfully ✅");
        setEditingProfile(false);
      } else {
        alert("Failed to update profile");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating profile");
    }
  };

  return (
    <div className="admin-dashboard">
      <ToastContainer />
      {/* ✅ Mobile Menu Toggle Button */}
      <button className="menu-toggle" onClick={() => setShowMenu(!showMenu)}>
        ADMIN TOOLS 🔐
      </button>

      {/* ✅ Sidebar */}
      <aside className={`side-panel ${showMenu ? "show" : "hide"}`}>
        <div className="admin-profile">
          <img src="./admin-logo.png" alt="Admin Profile" className="admin-photo" />
          <div className="admin-info">
            <h3>{session?.user?.name || "Monal Sutar"}</h3>
            <p>My Shop Quick Bill</p>
          </div>
        </div>

        <nav className="side-nav">
          <button
            className={activeCard === "stocks" ? "active" : ""}
            onClick={() => {
              setActiveCard("stocks");
              setEditingProfile(false);
              setShowMenu(false);
            }}
          >
            📦 Stocks
          </button>
          <button
            className={activeCard === "customers" ? "active" : ""}
            onClick={() => {
              setActiveCard("customers");
              setEditingProfile(false);
              setShowMenu(false);
            }}
          >
            🧑‍🤝‍🧑 Customers
          </button>
          <button
            className={activeCard === "workers" ? "active" : ""}
            onClick={() => {
              setActiveCard("workers");
              setEditingProfile(false);
              setShowMenu(false);
            }}
          >
            🧑‍🏭 Workers
          </button>
          <button
            className={activeCard === "stock-report" ? "active" : ""}
            onClick={() => {
              setActiveCard("stock-report");
              setEditingProfile(false);
              setShowMenu(false);
            }}
          >
            📊 Stock Report
          </button>
        </nav>

        <button
          className="logout-btn"
          onClick={() => {
            toast.success("Bye Bye, Admin Logged Out !👋");

            setTimeout(() => {
              signOut({ callbackUrl: "/login" });
            }, 1200); 

          }}>
          Logout
        </button>
      </aside>

      {/* ✅ Overlay for mobile */}
      {showMenu && <div className="overlay active" onClick={() => setShowMenu(false)}></div>}

      {/* Main Content */}
      <main className="main-panel">
        {editingProfile && (
          <section className="panel-section">
            <h2>Edit Profile</h2>
            <div className="profile-form">
              <label>Email:</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <label>Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
              />
              <div className="profile-buttons">
                <button className="save-btn" onClick={handleSaveProfile}>
                  Save
                </button>
                <button className="cancel-btn" onClick={() => setEditingProfile(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </section>
        )}

        {!editingProfile && activeCard === "stocks" && (
          <section>
            <br></br>
            <StockPageContent />
          </section>
        )}

        <br></br><br></br>
        {!editingProfile && activeCard === "customers" && (
          <section className="panel-section">

            <h2>All Customers 🧑‍🤝‍🧑</h2>
            <table border="1" cellPadding="8" align="center">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th>Phone Number</th>
                  <th>Added On</th>
                </tr>
              </thead>
              <tbody>
                {customers.length ? (
                  customers.map((c) => (
                    <tr key={c._id}>
                      <td>{c.name}</td>
                      <td>{c.email}</td>
                      <td>{c.address || "—"}</td>
                      <td>{c.phone || "—"}</td>
                      <td>{c.updatedAt ? new Date(c.updatedAt).toLocaleString() : "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">No customers found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )}

        {!editingProfile && activeCard === "workers" && (
          <section className="panel-section">

            <h2>All Users / Workers 🧑‍🏭</h2>
            <table border="1" cellPadding="8" align="center">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Last Login</th>
                  <th>Created At</th>
                  <th>Updated At</th>
                </tr>
              </thead>
              <tbody>
                {users.length ? (
                  users.map((u) => (
                    <tr key={u._id}>
                      <td>{u.email}</td>
                      <td>{u.role || "worker"}</td>
                      <td>{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "—"}</td>
                      <td>{u.createdAt ? new Date(u.createdAt).toLocaleString() : "—"}</td>
                      <td>{u.updatedAt ? new Date(u.updatedAt).toLocaleString() : "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )}

        {!editingProfile && activeCard === "stock-report" && (
          <section className="panel-section">
            <StockReport />
          </section>
        )}
      </main>
    </div >
  );
}
