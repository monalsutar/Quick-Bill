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
          <p className="subtitle">Here’s a quick view of your QuickBill activity</p>
        </header>

        {/* Render active view */}
        {activeView === "dashboard" && (
          <>
            <DashboardCards />
            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="action-buttons">
                <button onClick={() => setActiveView("addCustomer")}>➕ Add Customer</button>
                <button onClick={() => setActiveView("generateBill")}>💼 Generate New Bill</button>
                <button onClick={() => setActiveView("stockReport")}>📦 Stock Report</button>
              </div>
            </div>
            <RecentActivity />
          </>
        )}

        {activeView === "addCustomer" && (
          <div>
            <h3>➕ Add Customer</h3>
            {/* Navigate to existing customer page */}
            <button onClick={() => router.push("/customer")}>Open Add Customer Page</button>
          </div>
        )}

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
