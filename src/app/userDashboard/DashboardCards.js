"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import "./userDashboard.css";

export default function DashboardCards() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalBills: 0,
    totalRevenue: 0,
    stockItems: 0,
  });

  // Fetch summary data (you can update endpoints as per your setup)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersRes, billsRes, stockRes] = await Promise.all([
          axios.get("/api/customers"),
          axios.get("/api/bills"),
          axios.get("/api/stock"),
        ]);

        const totalRevenue = billsRes.data?.reduce(
          (acc, bill) => acc + (bill.totalAmount || 0),
          0
        );

        setStats({
          totalCustomers: customersRes.data?.length || 0,
          totalBills: billsRes.data?.length || 0,
          totalRevenue: totalRevenue || 0,
          stockItems: stockRes.data?.length || 0,
        });
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="dashboard-cards">
      <div className="card blue">
        <h4>👥 Customers</h4>
        <p>{stats.totalCustomers}</p>
        <span>Total Added</span>
      </div>

      <div className="card yellow">
        <h4>🧾 Bills</h4>
        <p>{stats.totalBills}</p>
        <span>Generated</span>
      </div>

      <div className="card green">
        <h4>💰 Revenue</h4>
        <p>₹{stats.totalRevenue.toFixed(2)}</p>
        <span>Total Sales</span>
      </div>

      <div className="card purple">
        <h4>📦 Stock Items</h4>
        <p>{stats.stockItems}</p>
        <span>In Store</span>
      </div>
    </div>
  );
}
