"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function CustomerPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const router = useRouter();

  const handleAddAndProceed = async () => {
    if (!name || !email || !phone || !address) {
      alert("Please fill all fields!");
      return;
    }

    try {
      const res = await axios.post("/api/customers", { name, email, phone, address });
      alert(res.data.message);
      router.push(`/proceed?customerId=${res.data.customerId}`);
    } catch (err) {
      if (err.response?.status === 400) {
        // Customer exists → get their ID from API
        const existingRes = await axios.get("/api/customers");
        const existingCustomer = existingRes.data.find(
          (c) => c.email === email || c.phone === phone
        );
        if (existingCustomer) {
          alert("Customer already exists! Proceeding...");
          router.push(`/proceed?customerId=${existingCustomer._id}`);
        }
      } else {
        alert("Error adding customer");
      }
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: "40px",
      }}
    >
      <h2>Fill Customer Details</h2>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ margin: "10px", padding: "8px", width: "250px" }}
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ margin: "10px", padding: "8px", width: "250px" }}
      />
      <input
        type="text"
        placeholder="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        style={{ margin: "10px", padding: "8px", width: "250px" }}
      />
      <input
        type="text"
        placeholder="Address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        style={{ margin: "10px", padding: "8px", width: "250px" }}
      />

      <button
        onClick={handleAddAndProceed}
        style={{
          margin: "10px",
          padding: "10px 15px",
          backgroundColor: "#0070f3",
          color: "white",
          border: "none",
          borderRadius: "5px",
        }}
      >
        Add Customer & Proceed
      </button>
    </div>
  );
}
