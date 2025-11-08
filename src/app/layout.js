"use client";

import "./globals.css";
// import Link from "next/link";

import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";
import localforage from "localforage";
import axios from "axios";

export default function RootLayout({ children }) {

  useEffect(() => {
    async function syncOfflineData() {
      // 1. Pending logins
      const pendingLogins = await localforage.getItem("pendingLogins") || [];
      for (const login of pendingLogins) {
        await axios.post("/api/login", login).catch(() => { });
      }
      await localforage.removeItem("pendingLogins");

      // 2. Pending customers
      const pendingCustomers = await localforage.getItem("pendingCustomers") || [];
      for (const c of pendingCustomers) {
        await axios.post("/api/customers", c).catch(() => { });
      }
      await localforage.removeItem("pendingCustomers");

      // 3. Pending products
      const pendingProducts = await localforage.getItem("pendingProducts") || [];
      for (const p of pendingProducts) {
        await axios.post("/api/products", p).catch(() => { });
      }
      await localforage.removeItem("pendingProducts");

      // 4. Pending bills
      const pendingBills = await localforage.getItem("pendingBills") || [];
      for (const b of pendingBills) {
        await axios.post("/api/bills", b).catch(() => { });
      }
      await localforage.removeItem("pendingBills");

      // 5. Pending emails
      const pendingEmails = await localforage.getItem("pendingEmails") || [];
      for (const e of pendingEmails) {
        await axios.post("/api/send-email", e).catch(() => { });
      }
      await localforage.removeItem("pendingEmails");

      if (pendingLogins.length + pendingCustomers.length + pendingProducts.length + pendingBills.length + pendingEmails.length > 0) {
        alert("Offline data synced successfully!");
      }
    }

    window.addEventListener("online", syncOfflineData);
    return () => window.removeEventListener("online", syncOfflineData);
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("✅ Service worker registered"))
        .catch((err) => console.error("Service worker registration failed:", err));
    }
  }, []);

  useEffect(() => {
  localforage.config({ name: "QuickBillReports", storeName: "reports" });
}, []);




  return (
    <html lang="en" title="Quick Bill">
      <title>Quick Bill</title>

      <link rel="icon" href="/quickbill-icon.png" type="image/png" />
      <link rel="manifest" href="/manifest.json" />
      <body className="bg-gray-50">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
