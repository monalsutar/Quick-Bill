"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import UserSidebar from "./UserSidebar";
import DashboardCards from "./DashboardCards";
import RecentActivity from "./RecentActivity";
import GenerateBillPanel from "./GenerateBillPanel";
import StockReportUser from "./StockReportUser";
import ChangePassword from "./ChangePassword";
import AddCustomer from "./AddCustomer";
import { ToastContainer, toast } from 'react-toastify';


import "./userDashboard.css";

export default function UserDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [activeView, setActiveView] = useState("dashboard"); // dashboard | addCustomer | generateBill | stockReport | changePassword

  useEffect(() => {
    if (session?.user) setUsername(session.user.name || "Merchant");
    else {
      const stored = localStorage.getItem("loggedInUser");
      if (stored) setUsername(JSON.parse(stored).name || "Merchant");
    }
  }, [session]);

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    signOut({ callbackUrl: "/" });
  };

  return (
    
    <div className="dashboard-container">
      <UserSidebar setActiveView={setActiveView} onLogout={handleLogout} />

      <div className="dashboard-main">
        <header className="dashboard-header">
          <h2>Welcome back, {username || "Merchant"} 👋</h2>

        </header>

        {activeView === "dashboard" && (
          <div className="home-dashboard">
            <div className="dashboard-hero">
              <div className="hero-content">
                <h2>Welcome to <span className="brand-text">QuickBill</span> 💼</h2>
                <p><i>
                  Streamline your billing, manage your customers, and track your stock —
                  all in one simple dashboard.</i>
                </p>
                <button
                  className="start-billing-btn"
                  onClick={() => router.push("/customer")}
                >
                  Start Billing 👉
                </button>
              </div>

              <div className="hero-illustration">
                <img src="/store.png" alt="Billing Illustration" />
              </div>
            </div>
          </div>
        )}


        <p className="subtitle">Here’s a quick view of your QuickBill activity</p>

        {/* Render active view */}
        {activeView === "dashboard" && (
          <>
            <DashboardCards />
            <div className="quick-actions">
              <h3>⚡ Quick Actions</h3>
              <p className="quick-actions-subtitle">
                Instantly access your most used billing features.
              </p>

              <div className="action-buttons">
                <div
                  className="action-card"
                  onClick={() => setActiveView("addCustomer")}
                >
                  <div className="icon-circle">➕</div>
                  <div className="action-info">
                    <h4>Add Customer</h4>
                    <p>Add new customers quickly and keep your records updated.</p>
                  </div>
                </div>

                <div
                  className="action-card"
                  onClick={() => setActiveView("generateBill")}
                >
                  <div className="icon-circle">💼</div>
                  <div className="action-info">
                    <h4>Generate Bill</h4>
                    <p>Create new invoices and share them instantly.</p>
                  </div>
                </div>

                <div
                  className="action-card"
                  onClick={() => setActiveView("stockReport")}
                >
                  <div className="icon-circle">📦</div>
                  <div className="action-info">
                    <h4>Stock Report</h4>
                    <p>Check your product availability and updates.</p>
                  </div>
                </div>
              </div>
            </div>

            <RecentActivity />
          </>
        )}

        {activeView === "addCustomer" && <AddCustomer />}


        {activeView === "generateBill" && <GenerateBillPanel />}

        {activeView === "stockReport" && <StockReportUser />}

        {activeView === "changePassword" && <ChangePassword />}

        <footer className="dashboard-footer">
          © {new Date().getFullYear()} QuickBill — Empowering Smart Billing
        </footer>
      </div>
    </div>
  );
}
