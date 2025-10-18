"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { signOut, useSession, getSession } from "next-auth/react";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // ----------------- Fetch admin data -----------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, custRes] = await Promise.all([
          axios.get("/api/admin/users"),
          axios.get("/api/admin/customers"),
        ]);

        console.log("Users:", usersRes.data);
        console.log("Customers:", custRes.data);

        setUsers(usersRes.data.users || []);
        setCustomers(custRes.data.customers || []);
      } catch (err) {
        console.error("Error fetching admin data:", err);
        alert("Error fetching admin data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);



  if (loading) return <div style={{ padding: 40 }}>Loading data...</div>;

  return (
    <>
      <div style={{ padding: "20px", fontFamily: "poppins" }}>

        <div style={{ display: "flex", justifyContent: "space-around", alignContent: "center", overflowX: "hidden" }}>


          <h1>🤵 Admin Dashboard 🏪</h1>

          <button
            style={{
              backgroundColor: "#f44336",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              marginTop: "10px",
              width: "10%",
              height: "20%"
            }}
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Logout
          </button>


        </div>

        {/* ---- USERS TABLE ---- */}
        <section style={{ marginTop: "30px", display: "flex", flexDirection: "column", justifyContent: "center", alignContent: "center" }}>


          <h2>All Users (Merchants 🧑‍🏭)</h2>
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
                    <td>
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "—"}
                    </td>
                    <td>{u.createdAt ? new Date(u.createdAt).toLocaleString() : "—"}</td>
                    <td>{u.updatedAt ? new Date(u.updatedAt).toLocaleString() : "—"}</td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* ---- CUSTOMERS TABLE ---- */}
        <section style={{ marginTop: "40px" }}>


          <h2>All Customers 🧑‍🤝‍🧑</h2>
          <table border="1" cellPadding="8" align="center">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Bill Type</th>
                <th>Added By (Worker)</th>
                <th>Added On</th>
              </tr>
            </thead>
            <tbody>
              {customers.length ? (
                customers.map((c) => (
                  <tr key={c._id}>
                    <td>{c.name}</td>
                    <td>{c.email}</td>
                    <td>{c.billMethod?.toUpperCase()}</td>
                    <td>{c.addedBy ? c.addedBy.name : "—"}</td>
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
      </div>
    </>
  );
}
