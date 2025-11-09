"use client";

import { useSession } from "next-auth/react";
import "./userDashboard.css";

export default function UserSidebar({ setActiveView, onLogout }) {
  const { data: session } = useSession();

  const nav = (view) => setActiveView(view);

  return (
    <div className="sidebar-container">
      <div>
        <div className="sidebar-logo">
          <img src="/logo4.png" alt="QuickBill Logo" />
         
        </div>

        <ul className="sidebar-menu">
          <li onClick={() => nav("dashboard")}>🏠 Dashboard</li>
          <li onClick={() => nav("addCustomer")}>👥 Add Customer</li>
          <li onClick={() => nav("stockReport")}>📦 Stock Report</li>
          <li onClick={() => nav("generateBill")}>🧾 Generate Bill</li>
          {/* show change password only if not google login (heuristic) */}
          {!session?.user?.email?.includes("@gmail.com") && (
            <li onClick={() => nav("changePassword")}>⚙️ Change Password</li>
          )}
        </ul>
      </div>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={onLogout}>🚪 Logout</button>
       
      </div>
    </div>
  );
}
