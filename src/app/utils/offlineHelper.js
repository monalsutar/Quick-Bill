import localforage from "localforage";

localforage.config({
  name: "QuickBillDB",
  storeName: "quickbill_data",
});

export const saveBillOffline = async (bill) => {
  const bills = (await localforage.getItem("offlineBills")) || [];
  bills.push(bill);
  await localforage.setItem("offlineBills", bills);
};

export const saveStockOffline = async (data) => {
  await localforage.setItem("stock", data);
};

export const getOfflineStock = async () => {
  return (await localforage.getItem("stock")) || [];
};

export const syncOfflineData = async () => {
  const offlineBills = await localforage.getItem("offlineBills");
  if (!offlineBills?.length) return;
  try {
    for (const bill of offlineBills) {
      await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bill),
      });
    }
    await localforage.removeItem("offlineBills");
    console.log("✅ Offline bills synced successfully");
  } catch (err) {
    console.error("⚠️ Sync failed:", err);
  }
};
