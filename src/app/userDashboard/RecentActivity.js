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

        const sortedCust = custRes.data
          ?.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 3);

        const sortedBills = billRes.data
          ?.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 3);

        setRecentCustomers(sortedCust);
        setRecentBills(sortedBills);
      } catch (err) {
        console.error("Error loading recent activity:", err);
      }
    };

    fetchRecentData();
  }, []);

  return (
    <div className="recent-activity-wrapper">
      <h2 className="recent-title">📊 Recent Activity Overview</h2>

      <div className="activity-grid">
        {/* Recent Customers */}
        <div className="activity-card blue-card">
          <div className="card-header">
            <h3>👥 Recent Customers</h3>
          </div>
          {recentCustomers.length > 0 ? (
            <ul className="activity-list">
              {recentCustomers.map((cust) => (
                <li key={cust._id} className="activity-item">
                  <div className="activity-icon customer-icon"></div>
                  <div className="activity-info">
                    <b>{cust.name}</b>
                    <p>{cust.phone || "No phone"}</p>
                    <small>
                      {new Date(cust.createdAt).toLocaleDateString()} &middot;{" "}
                      {new Date(cust.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-msg">No recent customers found.</p>
          )}
        </div>

        {/* Recent Bills */}
        <div className="activity-card green-card">
          <div className="card-header">
            <h3>🧾 Recent Bills</h3>
          </div>
          {recentBills.length > 0 ? (
            <ul className="activity-list">
              {recentBills.map((bill) => (
                <li key={bill._id} className="activity-item">
                  <div className="activity-icon bill-icon">💰</div>
                  <div className="activity-info">
                    <b>{bill.customer?.name || "Unnamed"}</b>
                    <p>₹{bill.totalAmount?.toFixed(2) || 0}</p>
                    <small>
                      {new Date(bill.createdAt).toLocaleDateString()} &middot;{" "}
                      {new Date(bill.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-msg">No recent bills found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
