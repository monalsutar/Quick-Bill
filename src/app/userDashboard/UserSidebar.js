"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import "./userDashboard.css";
import Image from "next/image";

export default function UserSidebar({ setActiveView }) {
  const { data: session, status } = useSession();
  const [active, setActive] = useState("dashboard");

  const nav = (view) => {
    setActive(view);
    setActiveView(view);
  };

  // ✅ handle loading or no session
  if (status === "loading") {
    return (
      <aside className="sidebar-container">
        <p style={{ textAlign: "center", marginTop: "50px" }}>Loading user...</p>
      </aside>
    );
  }

  const userName = session?.user?.name || "Merchant";
  const userEmail = session?.user?.email || "No email available";
  console.log("Session data:", session);


  return (
    <aside className="sidebar-container">
      <div className="sidebar-top">
        <div className="brand">
          <img src="/logo4.png" alt="QuickBill" className="brand-logo" />

        </div>

        {/* ✅ Profile Section */}
        <div className="profile">
          {/* console.log("🧠 Session user:", session?.user); */}

          {session?.user ? (
            <Image
              key={session.user.image}
              src={session.user.image}
              alt="User"
              width={80}
              height={80}
              className="profile-avatar"
            />
          ) : (
            <Image src="/user.png" alt="User" width={80} height={80} className="profile-avatar" />
          )}


          <div className="profile-info">
            <div className="profile-name">{userName}</div>
            <div className="profile-role">{userEmail}</div>
          </div>
        </div>

        {/* ✅ Navigation Menu */}
        <nav className="sidebar-menu">
          <button
            className={`menu-item ${active === "dashboard" ? "active" : ""}`}
            onClick={() => nav("dashboard")}
          >
            <span className="menu-icon">🏠</span>
            <span className="menu-label">Dashboard</span>
          </button>

          <button
            className={`menu-item ${active === "addCustomer" ? "active" : ""}`}
            onClick={() => nav("addCustomer")}
          >
            <span className="menu-icon">🤝</span>
            <span className="menu-label">Customers</span>
          </button>

          <button
            className={`menu-item ${active === "stockReport" ? "active" : ""}`}
            onClick={() => nav("stockReport")}
          >
            <span className="menu-icon">📦</span>
            <span className="menu-label">Stock</span>
          </button>

          <button
            className={`menu-item ${active === "generateBill" ? "active" : ""}`}
            onClick={() => nav("generateBill")}
          >
            <span className="menu-icon">🧾</span>
            <span className="menu-label">Generate Bill</span>
          </button>

          {/* Hide Change Password for Google login users */}
          {session?.user?.provider === "credentials" && (
            <button
              className={`menu-item ${active === "changePassword" ? "active" : ""}`}
              onClick={() => nav("changePassword")}
            >
              <span className="menu-icon">🔑</span>
              <span className="menu-label">Change Password</span>
            </button>
          )}
        </nav>
      </div>

      {/* ✅ Footer */}
      <div className="sidebar-footer">
        <div className="footer-row">
          <button className="footer-logout-btn" onClick={() => signOut({ callbackUrl: "/" })}>
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
