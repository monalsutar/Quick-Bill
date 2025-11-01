import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/dbConnect";
import Bill from "../../../../models/Bill";
import Stock from "../../../../models/Stock";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "daily";

    const now = new Date();
    let startDate = new Date();

    if (range === "daily") {
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "weekly") {
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "monthly") {
      startDate.setMonth(now.getMonth() - 1);
      startDate.setHours(0, 0, 0, 0);
    }

    console.log(`📊 Generating ${range} report since:`, startDate.toISOString());

    // Fetch all bills from given range
    const bills = await Bill.find({ createdAt: { $gte: startDate } }).lean();
    if (!bills.length) {
      return NextResponse.json({
        products: [],
        trend: [],
        totalRevenue: 0,
        totalSold: 0,
      });
    }

    // ✅ 1. Aggregate product-wise sold quantities and revenue
    const productMap = {};
    bills.forEach((bill) => {
      const items = bill.items || [];
      items.forEach((p) => {
        if (!p.productName) return;
        const name = p.productName;

        if (!productMap[name]) {
          productMap[name] = {
            productName: name,
            category: p.category || "Other",
            totalSold: 0,
            totalRevenue: 0,
          };
        }

        productMap[name].totalSold += Number(p.quantity || 0);
        productMap[name].totalRevenue += Number(p.price || 0) * Number(p.quantity || 0);
      });
    });

    const products = Object.values(productMap);
    const totalSold = products.reduce((s, p) => s + p.totalSold, 0);
    const totalRevenue = products.reduce((s, p) => s + p.totalRevenue, 0);

    products.forEach((p) => {
      p.demandPercentage = totalSold ? ((p.totalSold / totalSold) * 100).toFixed(2) : "0.00";
    });

    // ✅ 2. Fetch true stock quantities from DB (no assumptions)
    const stockDocs = await Stock.find({}, { productName: 1, quantityAvailable: 1, stock: 1 }).lean();
    const stockMap = {};
    stockDocs.forEach((s) => {
      stockMap[s.productName] =
        s.quantityAvailable !== undefined
          ? Number(s.quantityAvailable)
          : s.stock !== undefined
          ? Number(s.stock)
          : 0;
    });

    // attach actual stock to each product
    products.forEach((p) => {
      p.availableStock = stockMap[p.productName] ?? 0;
    });

    // ✅ 3. Daily trend (real)
    const trendMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      trendMap[key] = 0;
    }

    bills.forEach((bill) => {
      const billDate = new Date(bill.createdAt || bill.date);
      const key = billDate.toISOString().slice(0, 10);
      const items = bill.items || [];
      const qty = items.reduce((s, p) => s + (p.quantity || 0), 0);
      if (trendMap[key] !== undefined) trendMap[key] += qty;
    });

    const trend = Object.keys(trendMap).map((key) => {
      const d = new Date(key);
      return {
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        sold: trendMap[key],
      };
    });
    trend.push({ day: "Tomorrow", sold: 0 });

    // ✅ 4. Final report
    const report = {
      products,
      totalRevenue,
      totalSold,
      trend,
    };

    return NextResponse.json(report, { status: 200 });
  } catch (err) {
    console.error("❌ Error generating report:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
