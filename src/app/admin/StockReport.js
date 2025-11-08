"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList, } from "recharts";
import "./stockreport.css";

import localforage from "localforage";


// Helper to format DD/MM/YY or accept an ISO string/date
function formatDDMM(date) {
  const d = typeof date === "string" ? new Date(date) : new Date(date);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

// ISO date (YYYY-MM-DD)
function isoDate(date) {
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
}

// get Sunday for a given date (week start)
function getSunday(d) {
  const dt = new Date(d);
  const day = dt.getDay();
  dt.setHours(0, 0, 0, 0);
  dt.setDate(dt.getDate() - day);
  return dt;
}

export default function StockReport() {
  const [salesData, setSalesData] = useState([]);
  const [timeRange, setTimeRange] = useState("weekly");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalSold: 0,
    totalRevenue: 0,
    stockLeft: 0,
    lowStock: 0,
  });

  const [weekOffset, setWeekOffset] = useState(0);
  const [weeklyTrend, setWeeklyTrend] = useState([]);
  const [rawPayload, setRawPayload] = useState({});

  const [monthOffset, setMonthOffset] = useState(0);
  const [monthlyLabel, setMonthlyLabel] = useState("");


  const handlePrevMonth = () => setMonthOffset((prev) => prev - 1);
  const handleNextMonth = () => setMonthOffset((prev) => (prev >= 0 ? 0 : prev + 1));


  // Category colors (extend as needed)
  const categoryColors = {
    Food: "#FF8042",
    Groceries: "#007bff",
    Electronics: "#00C49F",
    Stationary: "#ef04fbff",
    Other: "#8884d8",
  };
  const COLORS = Object.values(categoryColors);

  // Refs for intervals
  const dailyIntervalRef = useRef(null);

  // --- Week navigation handlers with limits ---
  // We'll compute a minimum allowed week offset such that user cannot go earlier than Oct 2025.
  const today = new Date();
  const baseCurrentWeekStart = useMemo(() => getSunday(today), []);
  const minAllowedDate = useMemo(() => {
    // earliest allowed date = Oct 1st of current year (can be adjusted)
    // NOTE: system date per system message is Nov 7, 2025; this uses runtime date to compute year
    const year = baseCurrentWeekStart.getFullYear();
    return new Date(year, 9, 1); // month index 9 => October
  }, [baseCurrentWeekStart]);

  const minOffset = useMemo(() => {
    // number of weeks (can be negative) from current week (offset 0) to minAllowedDate
    const diffMs = getSunday(minAllowedDate) - baseCurrentWeekStart;
    return Math.floor(diffMs / (7 * 24 * 3600 * 1000)); // likely negative or 0
  }, [minAllowedDate, baseCurrentWeekStart]);

  const handlePrevWeek = () => {
    setWeekOffset((prev) => {
      const candidate = prev - 1;
      if (candidate < minOffset) return minOffset;
      return candidate;
    });
  };
  const handleNextWeek = () => {
    setWeekOffset((prev) => {
      const candidate = prev + 1;
      if (candidate > 0) return 0; // do not go into future weeks beyond current
      return candidate;
    });
  };

  useEffect(() => {
    setLoading(true);
    (async () => {
      if (timeRange === "monthly") {
        await fetchReportOnce("monthly", monthOffset);
      } else {
        await fetchReportOnce(timeRange, weekOffset);
      }
      setLoading(false);
    })();
  }, [timeRange, weekOffset, monthOffset]);


  // Compute current week's Sunday according to weekOffset
  const currentWeekStart = useMemo(() => {
    const sunday = new Date(baseCurrentWeekStart);
    sunday.setDate(sunday.getDate() + weekOffset * 7);
    sunday.setHours(0, 0, 0, 0);
    return sunday;
  }, [weekOffset, baseCurrentWeekStart]);

  const currentWeekRange = useMemo(() => {
    const start = new Date(currentWeekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }, [currentWeekStart]);

  const weekDates = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [currentWeekStart]);

  // Centralized fetch function that handles daily/weekly/monthly
  // --- Fetch report (daily / weekly / monthly) ---
  const fetchReportOnce = async (range = timeRange, offset = weekOffset) => {
    try {
      const res = await axios.get(`/api/reports?range=${range}&offset=${offset}`);
      console.log("📦 REPORT PAYLOAD:", res.data);
      const payload = res.data || {};

      // ---------- WEEKLY ----------
      if (range === "weekly") {
        const now = new Date();
        const todayIso = isoDate(now);

        // Build weekly trend (always 7 days)
        let builtTrend = [];
        if (payload.trend && payload.trend.length) {
          builtTrend = payload.trend.map((t) => {
            const iso = t.date;
            const d = new Date(iso);
            const shortDay = d.toLocaleDateString("en-US", { weekday: "short" });
            return {
              day: shortDay,
              date: iso === todayIso ? "Today" : formatDDMM(d),
              sold: Number(t.sold || 0),
              isToday: offset === 0 && iso === todayIso,
            };
          });
        }

        // if backend gave no data (no sales), still create empty 7 days
        if (builtTrend.length === 0) {
          const sunday = new Date(currentWeekStart);
          const arr = [];
          for (let i = 0; i < 7; i++) {
            const d = new Date(sunday);
            d.setDate(sunday.getDate() + i);
            arr.push({
              day: d.toLocaleDateString("en-US", { weekday: "short" }),
              date: formatDDMM(d),
              sold: 0,
              isToday: offset === 0 && isoDate(d) === todayIso,
            });
          }
          builtTrend = arr;
        }

        setWeeklyTrend(builtTrend);

        // ---------- SUMMARY & PRODUCTS ----------
        const products = payload.products || [];
        const totalRevenue = products.reduce((s, p) => s + Number(p.totalRevenue || 0), 0);
        const totalSold = products.reduce((s, p) => s + Number(p.totalSold || 0), 0);
        const totalStockLeft = products.reduce((s, p) => s + Number(p.availableStock || 0), 0);
        const lowStock = products.filter((p) => (p.availableStock ?? 9999) < 5).length || 0;

        setSummary({
          totalSold,
          totalRevenue,
          stockLeft: totalStockLeft,
          lowStock,
        });

        const detailed = products.map((p) => ({
          ...p,
          category: p.category || "Other",
          productName: p.productName || p.name || "Unnamed",
          totalSold: Number(p.totalSold || 0),
          totalRevenue: Number(p.totalRevenue || 0),
          availableStock: Number(p.availableStock || 0),
        })).sort((a, b) => b.totalSold - a.totalSold);

        setSalesData(detailed);
        return; // weekly done
      }

      // ---------- DAILY ----------
      if (range === "daily") {
        const products = payload.products || [];
        const totalRevenue = products.reduce((s, p) => s + Number(p.totalRevenue || 0), 0);
        const totalSold = products.reduce((s, p) => s + Number(p.totalSold || 0), 0);
        const totalStockLeft = products.reduce((s, p) => s + Number(p.availableStock || 0), 0);
        const lowStock = products.filter((p) => (p.availableStock ?? 9999) < 5).length || 0;

        setSummary({
          totalSold,
          totalRevenue,
          stockLeft: totalStockLeft,
          lowStock,
        });

        const detailed = products.map((p) => ({
          ...p,
          category: p.category || "Other",
          productName: p.productName || p.name || "Unnamed",
          totalSold: Number(p.totalSold || 0),
          totalRevenue: Number(p.totalRevenue || 0),
          availableStock: Number(p.availableStock || 0),
        })).sort((a, b) => b.totalSold - a.totalSold);

        setSalesData(detailed);
        return;
      }

      // ---------- MONTHLY ----------
      // ---------- MONTHLY ----------
      if (range === "monthly") {
        const products = payload.products || [];
        const totalRevenue = products.reduce((s, p) => s + Number(p.totalRevenue || 0), 0);
        const totalSold = products.reduce((s, p) => s + Number(p.totalSold || 0), 0);
        const totalStockLeft = products.reduce((s, p) => s + Number(p.availableStock || 0), 0);
        const lowStock = products.filter((p) => (p.availableStock ?? 9999) < 5).length || 0;

        setSummary({
          totalSold,
          totalRevenue,
          stockLeft: totalStockLeft,
          lowStock,
        });

        const detailed = products
          .map((p) => ({
            ...p,
            category: p.category || "Other",
            productName: p.productName || p.name || "Unnamed",
            totalSold: Number(p.totalSold || 0),
            totalRevenue: Number(p.totalRevenue || 0),
            availableStock: Number(p.availableStock || 0),
          }))
          .sort((a, b) => b.totalSold - a.totalSold);

        setSalesData(detailed);

        // ---- Month name for UI ----
        const now = new Date();
        const displayMonth = new Date(now.getFullYear(), now.getMonth() + offset, 1);
        const monthLabel = displayMonth.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
        setMonthlyLabel(monthLabel); // Add state for this

        return;
      }


    } catch (err) {
      console.error("❌ fetchReportOnce error:", err);
    }
  };




  // Main fetch whenever timeRange or weekOffset changes (for weekly/monthly/daily initial load)
  useEffect(() => {
    setLoading(true);
    (async () => {
      await fetchReportOnce(timeRange, weekOffset);
      setLoading(false);
    })();
  }, [timeRange, weekOffset]);




  // Realtime polling only for daily (every 10s). It updates summary, salesData and charts for daily.
  useEffect(() => {
    // clear previous interval
    if (dailyIntervalRef.current) {
      clearInterval(dailyIntervalRef.current);
      dailyIntervalRef.current = null;
    }

    if (timeRange === "daily") {
      // immediate fetch then poll
      (async function () {
        await fetchReportOnce("daily", weekOffset);
      })();

      dailyIntervalRef.current = setInterval(() => {
        fetchReportOnce("daily", weekOffset).catch((err) => console.error(err));
      }, 10 * 1000); // 10 seconds
    }

    return () => {
      if (dailyIntervalRef.current) {
        clearInterval(dailyIntervalRef.current);
        dailyIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, weekOffset]);

  if (loading)
    return <p style={{ textAlign: "center", padding: 20 }}>Loading {timeRange} report...</p>;

  const summaryTitle =
    timeRange === "daily" ? "Today's" : timeRange === "weekly" ? "This Week's" : "This Month's";

  // Helper for YAxis tick renderer (top selling) - find product category by name
  const yTickRenderer = (props) => {
    const { x, y, payload } = props;
    const productName = payload.value;
    const prod = salesData.find((p) => p.productName === productName);
    const color = categoryColors[prod?.category] || "#777";
    return (
      <g transform={`translate(${x - 10},${y + 4})`}>
        <circle cx={0} cy={0} r={5} fill={color} />
        {/* <text x={12} y={4} fontSize={12} fill="#333">
          {productName}
        </text> */}
      </g>
    );
  };

  return (
    <div className="stock-report-container">
      <h2 className="report-title">📊 QuickBill — Smart Stock Analytics Dashboard</h2>

      {/* Filters */}
      <div className="report-filters">
        {["daily", "weekly", "monthly"].map((r) => (
          <button
            key={r}
            onClick={() => {
              setTimeRange(r);
              setWeekOffset(0);
            }}
            className={timeRange === r ? "active" : ""}
          >
            {r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="summary-section">
        <div className="summary-card blue">
          <h4>{summaryTitle} Sales</h4>
          <p>{summary.totalSold}</p>
          <span>Units Sold</span>
        </div>
        <div className="summary-card yellow">
          <h4>{summaryTitle} Revenue</h4>
          <p>₹{Number(summary.totalRevenue).toFixed(2)}</p>
          <span>Total Income</span>
        </div>
        <div className="summary-card green">
          <h4>Stock Left</h4>
          <p>{summary.stockLeft}</p>
          <span>Units Left</span>
        </div>
        <div className="summary-card red">
          <h4>Low Stock</h4>
          <p>{summary.lowStock}</p>
          <span>Below Threshold</span>
        </div>
      </div>


      {/* Monthly View */}
      {timeRange === "monthly" && (
        <div className="chart-card full">
          <h3>🗓️ Monthly Report 🗓️</h3>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 10,
            }}
          >
            <div>
              <button
                onClick={handlePrevMonth}
                className="week-nav-btn"
                style={{
                  color: "black",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  border: "1px solid #aaa",
                  background: "#fff",
                }}
              >
                ⬅ <span>Previous Month</span>
              </button>

            </div>

            <b>{monthlyLabel || "Current Month"}</b>

            <div>
              <button
                onClick={handleNextMonth}
                className="week-nav-btn"
                disabled={monthOffset >= 0}
                style={{
                  color: "black",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  border: "1px solid #aaa",
                  background: monthOffset >= 0 ? "#ccc" : "#fff",
                  cursor: monthOffset >= 0 ? "not-allowed" : "pointer",
                }}
              >
                <span>Next Month</span> ➡
              </button>

            </div>
          </div>

          {/* You can show same top selling and revenue sections for this month here */}
          <p style={{ textAlign: "center", fontStyle: "italic" }}>
            Showing data for {monthlyLabel}
          </p>


        </div>
      )}
      <br></br>

      {/* Charts */}
      <div className="charts-grid">
        {/* Pie Chart */}
        <div className="chart-card">
          <h3>💰 Revenue Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart margin={{ top: 0, bottom: -10 }}>
              <Pie
                data={[
                  { name: "Revenue", value: summary.totalRevenue },
                  { name: "Expenses", value: summary.totalRevenue * 0.2 },
                  { name: "Loss", value: summary.totalRevenue * 0.1 },
                  { name: "Net Profit", value: summary.totalRevenue * 0.7 },
                ]}
                dataKey="value"
                outerRadius={90}
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              >
                {COLORS.map((c, i) => (
                  <Cell key={i} fill={c} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `₹${v.toFixed(2)}`} />
              <Legend verticalAlign="bottom" wrapperStyle={{ marginTop: -10 }} />
            </PieChart>
          </ResponsiveContainer>

        </div>

        {/* Horizontal Bar Chart */}
        {/* Horizontal Bar Chart */}
        <div className="chart-card">
          <h3>🔥 Top Selling Products</h3>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart

              layout="vertical"
              data={salesData.slice(0, 10)}
              margin={{ top: 20, right: 30, bottom: 20, left: -40 }} // remove left margin
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis type="number" />
              {/* Reduce width + small negative tick offset to pull bars closer left */}
              <YAxis
                dataKey="productName"
                type="category"
                width={80}
                tick={yTickRenderer}
                tickMargin={4}
              />
              <Tooltip formatter={(v, n, p) => [`${v} units`, `${p.payload.category}`]} />
              <Bar dataKey="totalSold" barSize={22} radius={[0, 6, 6, 0]}>
                {salesData.slice(0, 10).map((p, i) => (
                  <Cell key={i} fill={categoryColors[p.category] || "#007bff"} />
                ))}
                <LabelList dataKey="totalSold" position="right" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Category legend */}
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {Object.entries(categoryColors).map(([cat, color]) => (
              <div key={cat} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: color,
                  }}
                />
                <span style={{ fontSize: 12 }}>{cat}</span>
              </div>
            ))}
          </div>
        </div>


        {/* Weekly Trend (shown only when weekly selected) */}
        {timeRange === "weekly" && (
          <div className="chart-card full">
            <h3>📅 Weekly Sales Trend</h3>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 10,
              }}
            >
              <button
                className="week-nav-btn"
                onClick={handlePrevWeek}
                disabled={weekOffset <= minOffset}
              >
                ⬅ <span>Previous Week</span>
              </button>

              <p>
                {formatDDMM(currentWeekRange.start)} - {formatDDMM(currentWeekRange.end)}
              </p>

              <button
                className="week-nav-btn"
                onClick={handleNextWeek}
                disabled={weekOffset >= 0}
              >
                <span>Next Week</span> ➡
              </button>
            </div>

            <ResponsiveContainer width="100%" height={340}>
              <BarChart
                data={weeklyTrend}
                margin={{ top: 20, right: 20, bottom: 40, left: -30 }}
                barGap={4}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="day"
                  interval={0}
                  tick={({ x, y, index }) => {
                    const d = weeklyTrend[index];
                    if (!d) return null;

                    const isMobile = window.innerWidth < 600; // ✅ detect mobile
                    return (
                      <g transform={`translate(${x},${y + 10})`}>
                        <text
                          x={0}
                          y={0}
                          fontSize={11}
                          textAnchor="middle"
                          fill={d.isToday ? "#ff0000ff" : "#333"}
                          fontWeight={d.isToday ? "bold" : "normal"}
                        >
                          {d.day}
                        </text>

                        {/* ✅ Show date only on larger screens */}
                        {!isMobile && (
                          <text
                            x={0}
                            y={14}
                            fontSize={11}
                            textAnchor="middle"
                            fill={d.isToday ? "#0d00ffff" : "#666"}
                          >
                            {d.date}
                          </text>
                        )}
                      </g>
                    );
                  }}
                />

                <YAxis />
                <Tooltip formatter={(v) => `${v} units sold`} />
                <Bar dataKey="sold" barSize={window.innerWidth < 600 ? 22 : 36}>
                  {weeklyTrend.map((d, i) => (
                    <Cell key={i} fill={d.isToday ? "#ff7300ff" : "#00C49F"} />
                  ))}
                  <LabelList dataKey="sold" position="top" fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}




      </div>

      {/* Detailed Section */}
      <div className="category-stock-report">
        <h3>📦 {summaryTitle} Stock Summary</h3>
        {Array.from(new Set(salesData.map((s) => s.category || "Other"))).map((cat) => {
          const items = salesData.filter((p) => (p.category || "Other") === cat);
          if (!items.length) return null;
          return (
            <div key={cat} className="category-section">
              <h4 style={{ borderLeft: `5px solid ${categoryColors[cat]}`, paddingLeft: 8 }}>
                {cat}
              </h4>
              <div className="product-cards">
                {items.map((p, idx) => (
                  <div key={idx} className="product-card">
                    <h5>{p.productName}</h5>
                    <p>
                      Sold: <b>{p.totalSold}</b>
                    </p>
                    <p>
                      Revenue: <b>₹{Number(p.totalRevenue || 0).toFixed(2)}</b>
                    </p>
                    <p>
                      Available Stock: <b>{p.availableStock}</b>
                    </p>
                    <p>
                      Demand: <b>{p.demandPercentage || 0}%</b>
                    </p>
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
