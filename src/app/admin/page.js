"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { signOut, useSession } from "next-auth/react";

import StockPageContent from "./StockPageContent"; // Stock form
import "./stock.css"; // we'll define this below

export default function AdminPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [activeCard, setActiveCard] = useState("stocks"); // active panel
  const [loading, setLoading] = useState(true);


  const [editingProfile, setEditingProfile] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null); // for preview & upload
  const [name, setName] = useState(session?.user?.name || "");
  const [email, setEmail] = useState(session?.user?.email || "");
  const [password, setPassword] = useState(""); // leave blank initially



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


  // useEffect(() => {
  //   if (editingProfile) {
  //     const fetchAdmin = async () => {
  //       try {
  //         // const res = await axios.get("/api/admin/me"); // create an endpoint to get current admin
  //         setName(res.data.name);
  //         setEmail(res.data.email);
  //       } catch (err) {
  //         console.error(err);
  //       }
  //     };
  //     fetchAdmin();
  //   }
  // }, [editingProfile]);



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
      {/* Side Panel */}
      <aside className="side-panel">
        <div className="admin-profile">
          <img
            src="./admin-logo.png"
            alt="Admin Profile"
            className="admin-photo"
          />
          <div className="admin-info">
            <h3>{session?.user?.name || "Monal Sutar"}</h3>
            <p>My Shop Quick Bill</p>
            {/* <button
              className="edit-btn"
              onClick={() => {
                setEditingProfile(true);
                setActiveCard(""); // clear main panel cards
                setName(session?.user?.name || "");
                setEmail(session?.user?.email || "");
              }}
            >

              Edit Profile
            </button> */}
          </div>
        </div>

        <nav className="side-nav">
          <button
            className={activeCard === "stocks" ? "active" : ""}
            onClick={() => { setActiveCard("stocks"); setEditingProfile(false); }}
          >
            📦 Stocks
          </button>
          <button
            className={activeCard === "customers" ? "active" : ""}
            onClick={() => { setActiveCard("customers"); setEditingProfile(false); }}
          >
            🧑‍🤝‍🧑 Customers
          </button>
          <button
            className={activeCard === "workers" ? "active" : ""}
            onClick={() => { setActiveCard("workers"); setEditingProfile(false); }}
          >
            🧑‍🏭 Workers
          </button>
          <button
            className={activeCard === "stock-report" ? "active" : ""}
            onClick={() => { setActiveCard("stock-report"); setEditingProfile(false); }}
          >
            📊 Stock Report
          </button>
        </nav>

        <button className="logout-btn" onClick={() => signOut({ callbackUrl: "/" })}>
          Logout
        </button>
      </aside>

      {/* Main Panel */}
      <main className="main-panel">
        {editingProfile && (
          <section className="panel-section">
            <h2>Edit Profile</h2>
            <div className="profile-form">

              <label>Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
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
                <button
                  className="cancel-btn"
                  onClick={() => setEditingProfile(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </section>
        )}

        {!editingProfile && activeCard === "stocks" && (
          <section>
            {/* <h2>Manage Stock</h2> */}
            <StockPageContent />
          </section>
        )}

        {!editingProfile && activeCard === "customers" && (
          <section className="panel-section">
            {/* <h2>All Customers</h2> */}
            {/* Customers table code */}
            {!editingProfile && activeCard === "customers" && (
              <section>
                <h2>All Customers 🧑‍🤝‍🧑</h2>
                <table border="1" cellPadding="8" align="center">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      {/* <th>Bill Type</th>
                      <th>Added By</th> */}
                      <th>Added On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.length ? (
                      customers.map((c) => (
                        <tr key={c._id}>
                          <td>{c.name}</td>
                          <td>{c.email}</td>
                          {/* <td>{c.billMethod?.toUpperCase()}</td>
                          <td>{c.addedBy ? c.addedBy.name : "—"}</td> */}
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

          </section>
        )}

        {!editingProfile && activeCard === "workers" && (
          <section className="panel-section">
            {/* <h2>All Users / Workers</h2> */}
            {/* Users table code */}
            {!editingProfile && activeCard === "workers" && (
              <section>
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

          </section>
        )}

        {!editingProfile && activeCard === "stock-report" && (
          <section className="panel-section">
            <h2>Stock Report</h2>
            <p>Coming soon...</p>
          </section>
        )}
      </main>
    </div>
  );
}