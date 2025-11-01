"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList, } from "recharts";
import "./stockreport.css";

export default function StockReport() {
  const [salesData, setSalesData] = useState([]);
  const [timeRange, setTimeRange] = useState("weekly");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    today: 0,
    week: 0,
    stockLeft: 0,
    lowStock: 0,
    totalRevenue: 0,
  });
  const [weeklyTrend, setWeeklyTrend] = useState([]);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        // Get report + weekly trend from backend
        const res = await axios.get(`/api/reports?range=${timeRange}`);
        const payload = res.data || {};

        const products = payload.products || [];
        const trend = payload.trend || [];

        const totalRevenue = products.reduce((sum, p) => sum + (p.totalRevenue || 0), 0);
        const totalSold = products.reduce((sum, p) => sum + (p.totalSold || 0), 0);

        setSummary({
          today: totalSold,
          week: totalSold * 7,
          stockLeft: Math.max(1000 - totalSold, 0),
          lowStock: products.filter((p) => p.totalSold < 5).length,
          totalRevenue,
        });

        const combined = products.map((p) => ({
          ...p,
          label: `${p.category} → ${p.productName}`,
          availableStock: p.availableStock, // ← real DB value
        }));

        combined.sort((a, b) => b.totalSold - a.totalSold);
        setSalesData(combined);

        // 🧠 Use REAL trend data from backend, not random
        const today = new Date().toLocaleDateString("en-US", { weekday: "short" });
        const yesterday = new Date(
          new Date().setDate(new Date().getDate() - 1)
        ).toLocaleDateString("en-US", { weekday: "short" });

        const trendWithHighlights = trend.map((d) => ({
          ...d,
          isToday: d.day === today,
          isYesterday: d.day === yesterday,
        }));

        setWeeklyTrend(trendWithHighlights);
      } catch (err) {
        console.error(err);
        alert("Error fetching report data");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [timeRange]);



  if (loading) return <p>Loading {timeRange} stock report...</p>;

  const categoryColors = {
    Groceries: "#007bff",
    Electronics: "#00C49F",
    Stationery: "#FFBB28",
    Beverages: "#FF8042",
    Other: "#8884d8",
  };

  const COLORS = ["#007bff", "#FFBB28", "#FF8042", "#00C49F", "#8884d8"];

  const pieData = [
    { name: "Revenue", value: summary.totalRevenue },
    { name: "Expenses (20%)", value: summary.totalRevenue * 0.2 },
    { name: "Loss (10%)", value: summary.totalRevenue * 0.1 },
    { name: "Net Profit", value: summary.totalRevenue * 0.7 },
  ];

  return (
    <div className="stock-report-container">
      <h2 className="report-title">📊 QuickBill — Smart Stock Analytics Dashboard</h2>

      {/* Filter Buttons */}
      <div className="report-filters">
        {["daily", "weekly", "monthly"].map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={timeRange === range ? "active" : ""}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="summary-section">
        <div className="summary-card blue">
          <h4>Today’s Sales</h4>
          <p>{summary.today}</p>
          <span>Units Sold</span>
        </div>
        <div className="summary-card yellow">
          <h4>This Week</h4>
          <p>{summary.week}</p>
          <span>Total Units</span>
        </div>
        <div className="summary-card green">
          <h4>Stock Left</h4>
          <p>{summary.stockLeft}</p>
          <span>Approx. Units</span>
        </div>
        <div className="summary-card red">
          <h4>Low Stock</h4>
          <p>{summary.lowStock}</p>
          <span>Items Below Threshold</span>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Pie Chart */}
        <div className="chart-card">
          <h3>💰 Revenue Breakdown</h3>
          <p className="chart-description">
            Breakdown of revenue into Expenses (20%), Loss (10%), and Net Profit (70%).
          </p>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={pieData}
                cx="55%"
                cy="50%"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                outerRadius={100}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `₹${v.toFixed(2)}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Horizontal Bar Chart */}
        <div className="chart-card">
          <h3>🔥 Most Demanded Products (By Category)</h3>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart
              layout="vertical"
              data={salesData.slice(0, 7)}
              margin={{ top: 20, right: 30, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="label" type="category" width={180} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(v, name, props) =>
                  [`${v} units sold`, `${props.payload.category} (${props.payload.productName})`]
                }
              />
              <Legend />
              <Bar dataKey="totalSold" name="Units Sold" barSize={22} radius={[0, 5, 5, 0]}>
                {salesData.slice(0, 7).map((entry, i) => (
                  <Cell key={i} fill={categoryColors[entry.category] || "#007bff"} />
                ))}
                <LabelList dataKey="totalSold" position="right" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Vertical Weekly Trend */}
        <div className="chart-card full">
          <h3>📅 Weekly Sales Trend</h3>
          <p className="chart-description">Sales pattern for the last 7 days. Today and yesterday are highlighted.</p>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={weeklyTrend} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(v) => `${v} units sold`} />
              <Legend />
              <Bar dataKey="sold" barSize={35}>
                {weeklyTrend.map((d, i) => (
                  <Cell
                    key={i}
                    fill={
                      d.day === "Tomorrow"
                        ? "#ccc"
                        : d.isToday
                          ? "#007bff"
                          : d.isYesterday
                            ? "#FFBB28"
                            : "#00C49F"
                    }
                  />
                ))}
                <LabelList dataKey="sold" position="top" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category-wise Detailed Report */}
      <div className="category-stock-report">
        <h3>📦 {timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} Stock Summary</h3>
        {Object.keys(categoryColors).map((cat) => {
          const items = salesData.filter((p) => p.category === cat);
          if (!items.length) return null;
          return (
            <div key={cat} className="category-section">
              <h4 style={{ borderLeft: `5px solid ${categoryColors[cat]}` }}>{cat}</h4>
              <div className="product-cards">
                {items.map((p, i) => (
                  <div className="product-card" key={i}>
                    <h5>{p.productName}</h5>
                    <p>Sold: <b>{p.totalSold}</b></p>
                    <p>Revenue: <b>₹{p.totalRevenue.toFixed(2)}</b></p>
                    <p>Available Stock: <b>{p.availableStock}</b></p>
                    <p>Demand: <b>{p.demandPercentage}%</b></p>
                    <span className={`stock-status ${p.availableStock <= 20 ? "low" : "ok"}`}>
                      {p.availableStock <= 20 ? "Low Stock" : "In Stock"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
