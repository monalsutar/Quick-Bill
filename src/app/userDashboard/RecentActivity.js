"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import "./userDashboard.css";

export default function RecentActivity() {
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [recentBills, setRecentBills] = useState([]);

  useEffect(() => {
    const fetchRecentData = async () => {
      try {
        const [custRes, billRes] = await Promise.all([
          axios.get("/api/customers"),
          axios.get("/api/bills"),
        ]);

        // Sort by latest (assuming createdAt exists in DB)
        const sortedCust = custRes.data
          ?.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);

        const sortedBills = billRes.data
          ?.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);

        setRecentCustomers(sortedCust);
        setRecentBills(sortedBills);
      } catch (err) {
        console.error("Error loading recent activity:", err);
      }
    };

    fetchRecentData();
  }, []);

  return (
    <div className="recent-activity">
      <h3>📋 Recent Activity</h3>

      <div className="activity-section">
        <h4>👥 Recently Added Customers</h4>
        {recentCustomers.length > 0 ? (
          <ul className="activity-list">
            {recentCustomers.map((cust) => (
              <li key={cust._id}>
                <b>{cust.name}</b> — {cust.phone || "No phone"} <br />
                <small>{new Date(cust.createdAt).toLocaleString()}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-msg">No recent customers found.</p>
        )}
      </div>

      <div className="activity-section">
        <h4>🧾 Recent Bills</h4>
        {recentBills.length > 0 ? (
          <ul className="activity-list">
            {recentBills.map((bill) => (
              <li key={bill._id}>
                <b>{bill.customer?.name || "Unnamed"}</b> — ₹
                {bill.totalAmount?.toFixed(2) || 0} <br />
                <small>{new Date(bill.createdAt).toLocaleString()}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-msg">No recent bills found.</p>
        )}
      </div>
    </div>
  );
}
