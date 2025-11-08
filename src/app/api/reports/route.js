import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/dbConnect";
import Bill from "../../../../models/Bill";
import Stock from "../../../../models/Stock";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "daily";
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    // ✅ DAILY
    if (range === "daily") {
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
    }

    // ✅ WEEKLY (Sunday to Saturday)
    // In /api/reports (weekly)
    // const now = new Date();
    // ✅ WEEKLY (Sunday → Saturday)

    // ✅ WEEKLY (Sunday → Saturday)
    // ✅ WEEKLY (Sunday → Saturday)
else if (range === "weekly") {
  const today = new Date();

  // Find the current Sunday (week start)
  const currentSunday = new Date(today);
  currentSunday.setDate(today.getDate() - today.getDay() + offset * 7);

  // ✅ Use local midnight instead of UTC
  const weekStart = new Date(
    currentSunday.getFullYear(),
    currentSunday.getMonth(),
    currentSunday.getDate(),
    0, 0, 0, 0
  );

  const weekEnd = new Date(
    weekStart.getFullYear(),
    weekStart.getMonth(),
    weekStart.getDate() + 6,
    23, 59, 59, 999
  );

  startDate = weekStart;
  endDate = weekEnd;

  console.log(`📅 Weekly range (LOCAL): ${startDate.toLocaleString()} → ${endDate.toLocaleString()}`);
}




    // ✅ MONTHLY (calendar month)
    else if (range === "monthly") {
      const now = new Date();

      // The current month = (current date - current day of month + 1)
      // monthOffset is applied to shift months correctly
      const target = new Date(now.getFullYear(), now.getMonth() + offset, 1);

      // Start = 1st day of the target month (00:00:00)
      startDate = new Date(target.getFullYear(), target.getMonth(), 1, 0, 0, 0, 0);

      // End = last day of the target month (23:59:59)
      endDate = new Date(target.getFullYear(), target.getMonth() + 1, 0, 23, 59, 59, 999);

      console.log(`🗓 Monthly range: ${startDate.toISOString()} → ${endDate.toISOString()}`);
    }


    // 🧾 Fetch bills only within this date range
    const bills = await Bill.find({
      createdAt: { $gte: startDate, $lte: endDate },
    }).lean();

    if (!bills.length) {
      return NextResponse.json({
        products: [],
        trend: [],
        totalRevenue: 0,
        totalSold: 0,
      });
    }

    // ✅ Product aggregation
    const productMap = {};
    for (const bill of bills) {
      for (const item of bill.items || []) {
        if (!item.productName) continue;
        const name = item.productName;
        if (!productMap[name]) {
          productMap[name] = {
            productName: name,
            category: item.category || "Other",
            totalSold: 0,
            totalRevenue: 0,
          };
        }
        productMap[name].totalSold += Number(item.quantity || 0);
        productMap[name].totalRevenue += Number(item.price || 0) * Number(item.quantity || 0);
      }
    }

    const products = Object.values(productMap);
    const totalSold = products.reduce((s, p) => s + p.totalSold, 0);
    const totalRevenue = products.reduce((s, p) => s + p.totalRevenue, 0);
    products.forEach((p) => {
      p.demandPercentage = totalSold
        ? ((p.totalSold / totalSold) * 100).toFixed(2)
        : "0.00";
    });

    // ✅ Attach live stock
    const stockDocs = await Stock.find({}, { productName: 1, quantityAvailable: 1, stock: 1 }).lean();
    const stockMap = {};
    for (const s of stockDocs) {
      stockMap[s.productName] = s.quantityAvailable ?? s.stock ?? 0;
    }
    for (const p of products) {
      p.availableStock = stockMap[p.productName] ?? 0;
    }

    // ✅ Trend (for daily/weekly/monthly charts)
    // ✅ Trend (for daily/weekly/monthly charts)
const trendMap = {};
const cursor = new Date(startDate);
while (cursor <= endDate) {
  const key = cursor.toLocaleDateString("en-CA"); // YYYY-MM-DD in local timezone
  trendMap[key] = 0;
  cursor.setDate(cursor.getDate() + 1);
}


    for (const bill of bills) {
      const billDate = new Date(bill.createdAt || bill.date);

      // ✅ Fix timezone so sales made today appear correctly
      const key = billDate.toLocaleDateString("en-CA"); // local date format


      const qty = (bill.items || []).reduce((s, i) => s + (i.quantity || 0), 0);
      if (trendMap[key] !== undefined) trendMap[key] += qty;
    }


    const trend = Object.keys(trendMap).map((key) => {
      const d = new Date(key);
      return {
        date: key,
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        sold: trendMap[key],
      };
    });

    return NextResponse.json(
      { products, totalRevenue, totalSold, trend },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Report generation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
